import {  DepositCall, RedeemCall  } from '../generated/DAIBondDepository.sol/DAIBondDepository'
import { DaiBondDeposit, DaiBondRedeem } from '../generated/schema'
import { loadOrCreateTransaction } from "./utils/Transactions"
import { loadOrCreateOHMie } from "./utils/OHMie"
import { toDecimal } from "./utils/Decimals"

export function handleDeposit(call: DepositCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)

  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  
  let amount = toDecimal(call.inputs.amount_)

  let deposit = new DaiBondDeposit(transaction.id)
  deposit.transaction = transaction.id
  deposit.ohmie = ohmie.id
  deposit.amount = amount
  deposit.maxPremium = toDecimal(call.inputs.maxPremium_)
  deposit.save()

  ohmie.daiBondTotalDeposit = ohmie.daiBondTotalDeposit.plus(amount)
  ohmie.save()
}

export function handleRedeem(call: RedeemCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)

  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  
  let redeem = new DaiBondRedeem(transaction.id)
  redeem.transaction = transaction.id
  redeem.ohmie = ohmie.id
  redeem.save()
}