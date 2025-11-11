/**
 * x402 Tipping Service for Agent (EXPERIMENTAL - NOT CURRENTLY WORKING)
 *
 * STATUS: This implementation is ~95% complete but currently fails with a Solana-specific
 * validation error from the x402 facilitator.
 *
 * ERROR: "invalid_exact_svm_payload_transaction_instructions_length"
 * - This error is NOT documented in the x402 specification
 * - Occurs during facilitator.verifyPayment() call
 * - Human browser-based tipping works perfectly with the same endpoint
 * - The x402 documentation confirms autonomous agents ARE supported
 *
 * ISSUE: The facilitator is rejecting the transaction structure we're building.
 * It appears to be validating the number of compiled instructions and finding
 * a mismatch with what it expects for the Solana "exact" payment scheme.
 *
 * WHAT WE TRIED:
 * 1. Building VersionedTransaction with single SPL token transfer instruction
 * 2. Using extra.feePayer from payment requirements as fee payer
 * 3. Using payTo from payment requirements as fee payer
 * 4. Creating token accounts separately before x402 transaction
 * 5. Signing with CDP wallet (server-side Coinbase Developer Platform wallet)
 *
 * WAITING FOR: Clarification from x402/Pay AI team on correct Solana transaction
 * structure for autonomous agents in Node.js environment.
 *
 * MEANWHILE: Agent uses direct CDP wallet transfers (see cdp-tipper.ts)
 *
 * This code is preserved for future use once the x402 Solana transaction
 * format is clarified by the facilitator team.
 *
 * Server-side implementation using x402-solana utilities
 */

import { FacilitatorClient, type PaymentRequirements } from "x402-solana/server";
import { createPaymentHeaderFromTransaction } from "x402-solana/utils";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { CdpClient } from "@coinbase/cdp-sdk";
import { getOrCreateAgentWallet, getAgentBalance } from "./cdp-wallet";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const USDC_DEVNET_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

// Initialize clients
const cdp = new CdpClient();
const connection = new Connection(SOLANA_RPC_URL, "confirmed");
const facilitatorClient = new FacilitatorClient("https://facilitator.payai.network");

export interface X402TipResult {
  success: boolean;
  signature?: string;
  error?: string;
  amount?: number;
}

/**
 * Tip a creator via x402 protocol
 *
 * @param creatorSlug - Creator's slug (e.g., "neryl")
 * @param amountUSDC - Tip amount in USDC
 * @param reason - AI reasoning for tip
 * @returns Tip result with transaction signature
 */
export async function tipCreatorViaX402(
  creatorSlug: string,
  amountUSDC: number,
  reason: string
): Promise<X402TipResult> {
  try {
    console.log(`[x402 Tipper] Tipping @${creatorSlug} via x402...`);
    console.log(`[x402 Tipper] Amount: $${amountUSDC} USDC`);
    console.log(`[x402 Tipper] Reason: ${reason}`);

    // Check agent balance first
    const balance = await getAgentBalance();
    if (balance.balanceUSDC < amountUSDC) {
      return {
        success: false,
        error: `Insufficient USDC. Have: $${balance.balanceUSDC.toFixed(2)}, Need: $${amountUSDC.toFixed(2)}`,
      };
    }

    // Get creator info
    const creatorResponse = await fetch(`${BASE_URL}/api/creators?slug=${creatorSlug}`);
    if (!creatorResponse.ok) {
      return {
        success: false,
        error: "Creator not found",
      };
    }

    const { creator } = await creatorResponse.json();
    const agentWallet = await getOrCreateAgentWallet();

    // Step 1: GET the x402 endpoint to get payment requirements
    const x402Endpoint = `${BASE_URL}/api/x402/tip/${creatorSlug}/pay-solana?amount=${amountUSDC}&agent_id=blinktip_agent&content_url=https://twitter.com/${creator.twitter_handle}`;

    console.log(`[x402 Tipper] Fetching payment requirements...`);
    const requirementsResponse = await fetch(x402Endpoint, {
      method: "GET",
    });

    if (requirementsResponse.status !== 402) {
      return {
        success: false,
        error: `Expected 402 response, got ${requirementsResponse.status}`,
      };
    }

    const responseData = await requirementsResponse.json();
    const paymentRequirements: PaymentRequirements = responseData.accepts[0];

    console.log(`[x402 Tipper] Payment requirements received`);
    console.log(`[x402 Tipper] Max amount: ${paymentRequirements.maxAmountRequired} micro-USDC`);
    console.log(`[x402 Tipper] Pay to: ${paymentRequirements.payTo}`);

    // Step 2: Get fee payer from payment requirements
    // Use extra.feePayer if available (facilitator), otherwise payTo (creator)
    const feePayerAddress = paymentRequirements.extra?.feePayer
      ? (paymentRequirements.extra.feePayer as string)
      : paymentRequirements.payTo;

    console.log(`[x402 Tipper] Fee payer: ${feePayerAddress}`);
    console.log(`[x402 Tipper] Fee payer source: ${paymentRequirements.extra?.feePayer ? 'facilitator (extra.feePayer)' : 'creator (payTo)'}`);

    // Step 3: Build Solana payment transaction
    const fromPubkey = new PublicKey(agentWallet.address);
    const toPubkey = new PublicKey(paymentRequirements.payTo); // Use payTo from requirements
    const feePayerPubkey = new PublicKey(feePayerAddress);
    const usdcMint = new PublicKey(USDC_DEVNET_MINT);

    const fromTokenAccount = await getAssociatedTokenAddress(usdcMint, fromPubkey);
    const toTokenAccount = await getAssociatedTokenAddress(usdcMint, toPubkey);

    // Use maxAmountRequired from payment requirements
    const tokenAmount = BigInt(paymentRequirements.maxAmountRequired);

    // Check if recipient token account exists, create if not (BEFORE x402 transaction)
    const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
    if (!toAccountInfo) {
      console.log("[x402 Tipper] Creating token account for recipient first...");

      // Create a separate transaction to create the account
      const createAccountTx = new Transaction();
      createAccountTx.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey, // payer
          toTokenAccount, // associated token address
          toPubkey, // owner
          usdcMint // mint
        )
      );

      const { blockhash: createBlockhash } = await connection.getLatestBlockhash();
      createAccountTx.recentBlockhash = createBlockhash;
      createAccountTx.feePayer = fromPubkey;

      // Serialize and sign with CDP
      const createTxSerialized = Buffer.from(
        createAccountTx.serialize({ requireAllSignatures: false })
      ).toString("base64");

      const createSignResult = await cdp.solana.signTransaction({
        address: agentWallet.address,
        transaction: createTxSerialized,
      });

      const createSignedTx = Buffer.from(createSignResult.signature, "base64");

      // Send and confirm
      const createTxSig = await connection.sendRawTransaction(createSignedTx);
      await connection.confirmTransaction(createTxSig);

      console.log("[x402 Tipper] ✓ Token account created");
    }

    // Build x402 payment transaction with ONLY the transfer instruction
    const instructions = [];

    // Add ONLY transfer instruction (x402 exact scheme requires exactly 1 instruction)
    instructions.push(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPubkey,
        tokenAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();

    // Create versioned transaction with fee payer
    const messageV0 = new TransactionMessage({
      payerKey: feePayerPubkey, // Facilitator pays fees
      recentBlockhash: blockhash,
      instructions: instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    console.log(`[x402 Tipper] Transaction built with ${instructions.length} instruction(s)`);
    console.log(`[x402 Tipper] Instructions:`, instructions.map(i => i.programId.toString()));

    // Step 4: Sign transaction with CDP (agent wallet signs as sender)
    console.log(`[x402 Tipper] Signing transaction with CDP...`);
    const serializedTx = Buffer.from(transaction.serialize()).toString("base64");
    const signResult = await cdp.solana.signTransaction({
      address: agentWallet.address,
      transaction: serializedTx,
    });

    const signedTx = VersionedTransaction.deserialize(
      Buffer.from(signResult.signature, "base64")
    );

    console.log(`[x402 Tipper] Signed transaction has ${signedTx.message.compiledInstructions.length} compiled instructions`);

    // Step 5: Create payment header from signed transaction
    console.log(`[x402 Tipper] Creating payment header...`);
    const paymentHeader = createPaymentHeaderFromTransaction(
      signedTx,
      paymentRequirements,
      1 // x402 version
    );

    // Step 6: Verify payment with facilitator
    console.log(`[x402 Tipper] Verifying payment with facilitator...`);
    const verifyResult = await facilitatorClient.verifyPayment(
      paymentHeader,
      paymentRequirements
    );

    if (!verifyResult.isValid) {
      return {
        success: false,
        error: `Payment verification failed: ${verifyResult.invalidReason}`,
      };
    }

    console.log(`[x402 Tipper] ✓ Payment verified`);

    // Step 7: Settle payment with facilitator (this sends the transaction)
    console.log(`[x402 Tipper] Settling payment with facilitator...`);
    const settleResult = await facilitatorClient.settlePayment(
      paymentHeader,
      paymentRequirements
    );

    if (!settleResult.success) {
      return {
        success: false,
        error: `Payment settlement failed: ${settleResult.errorReason}`,
      };
    }

    console.log(`[x402 Tipper] ✓ Payment settled! TX: ${settleResult.transaction}`);

    // Step 8: POST to endpoint with payment proof
    console.log(`[x402 Tipper] Notifying platform...`);
    const finalResponse = await fetch(x402Endpoint, {
      method: "POST",
      headers: {
        "X-Payment": paymentHeader,
      },
    });

    if (!finalResponse.ok) {
      const errorData = await finalResponse.json();
      return {
        success: false,
        error: errorData.error || "Endpoint rejected x402 payment",
      };
    }

    const result = await finalResponse.json();

    if (result.success) {
      console.log(`[x402 Tipper] ✓ Tip recorded on platform!`);
      return {
        success: true,
        signature: result.tip?.transaction || settleResult.transaction,
        amount: amountUSDC,
      };
    }

    return {
      success: false,
      error: result.error || "Unknown error",
    };
  } catch (error: any) {
    console.error("[x402 Tipper] Error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}
