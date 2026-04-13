import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import * as Linking from 'expo-linking'

// Testnet for MWA chain declaration; RPC also on testnet
const RPC_ENDPOINT = clusterApiUrl('testnet')
const USDC_MINT = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'

export interface WalletAccount {
  address: string
  label?: string
}

export interface SignedDeposit {
  /** Base58-encoded signature returned by Phantom */
  signature: string
  /** The amount the user entered — passed through for DB credit */
  amount: number
}

/**
 * SolanaService — MWA interactions (connect, balance, sign).
 *
 * NOTE: signDepositMessage uses signMessages (off-chain signing), NOT a real
 * on-chain transaction. The signature proves Phantom approved the action and
 * will be replaced by a real USDC transfer in production.
 */
class SolanaService {
  private connection: Connection

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed')
  }

  /**
   * Connect to a mobile wallet (like Phantom) using MWA.
   * Returns the primary wallet address.
   */
  async connectWallet(): Promise<WalletAccount> {
    return await transact(async (wallet) => {
      const authorizationResult = await wallet.authorize({
        chain: 'solana:testnet',
        identity: {
          name: 'Vàng Heo Đất',
          uri: Linking.createURL('/'),
          icon: 'assets/icon.png',
        },
      })

      const account = authorizationResult.accounts[0]
      // MWA returns Base64EncodedAddress — convert to base58
      const addressBytes = Buffer.from(account.address, 'base64')
      const base58Address = new PublicKey(addressBytes).toBase58()
      return { address: base58Address, label: account.label }
    })
  }

  /**
   * Ask Phantom to sign an off-chain deposit intent message.
   *
   * Flow (mock):
   *   1. Build a human-readable message with amount + timestamp
   *   2. transact() opens Phantom → user sees message and approves
   *   3. Phantom returns Ed25519 signature bytes
   *   4. Convert signature to base58 string for display + DB record
   *
   * Production replacement: build a real SPL-token transfer transaction
   * here instead of a plain message, then submit it to the network.
   */
  async signDepositMessage(amount: number): Promise<SignedDeposit> {
    return await transact(async (wallet) => {
      // Re-authorize (reuses existing session if Phantom is already connected)
      const authResult = await wallet.authorize({
        chain: 'solana:testnet',
        identity: {
          name: 'Vàng Heo Đất',
          uri: Linking.createURL('/'),
          icon: 'assets/icon.png',
        },
      })

      // Build the message bytes — visible to user inside Phantom
      const message = [
        'Vàng Heo Đất — Deposit Intent',
        `Amount: ${amount.toFixed(2)} USDC`,
        `Time: ${new Date().toISOString()}`,
        'This is a mock signature. No on-chain transfer occurs yet.',
      ].join('\n')

      // web3js wrapper: payloads are raw Uint8Array, returns Uint8Array[]
      const messageBytes = new TextEncoder().encode(message)

      const signedPayloads = await wallet.signMessages({
        addresses: [authResult.accounts[0].address],
        payloads: [messageBytes],
      })

      // Convert signed payload bytes → base58 string for display
      const signature = this._uint8ArrayToBase58(signedPayloads[0])

      return { signature, amount }
    })
  }

  /**
   * Fetch SOL balance for a given public key.
   */
  async getBalance(address: string): Promise<number> {
    try {
      const pubkey = new PublicKey(address)
      const balance = await this.connection.getBalance(pubkey)
      return balance / 1e9
    } catch (error) {
      console.error('[SolanaService] Error fetching SOL balance:', error)
      return 0
    }
  }

  /**
   * Fetch USDC testnet balance for a given public key.
   */
  async getUSDCBalance(address: string): Promise<number> {
    try {
      const pubkey = new PublicKey(address)
      const usdcMint = new PublicKey(USDC_MINT)
      const response = await this.connection.getTokenAccountsByOwner(pubkey, { mint: usdcMint })
      if (response.value.length === 0) return 0
      const balanceResponse = await this.connection.getTokenAccountBalance(response.value[0].pubkey)
      return balanceResponse.value.uiAmount || 0
    } catch (error) {
      console.error('[SolanaService] Error fetching USDC balance:', error)
      return 0
    }
  }

  getPublicAddress(address: string): string {
    return new PublicKey(address).toBase58()
  }

  /** Convert Uint8Array → base58 string without external dependency */
  private _uint8ArrayToBase58(bytes: Uint8Array): string {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    const digits: number[] = [0]
    for (let i = 0; i < bytes.length; i++) {
      let carry = bytes[i]
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8
        digits[j] = carry % 58
        carry = (carry / 58) | 0
      }
      while (carry > 0) {
        digits.push(carry % 58)
        carry = (carry / 58) | 0
      }
    }
    let result = ''
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result += '1'
    for (let i = digits.length - 1; i >= 0; i--) result += ALPHABET[digits[i]]
    return result
  }
}

export const solanaService = new SolanaService()
