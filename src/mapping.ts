import {  DepositCall, RedeemCall  } from '../generated/DAIBondDepository.sol/DAIBondDepository'
import { DaiBondDeposit, DaiBondRedeem } from '../generated/schema'
import { loadOrCreateTransaction } from "./utils/Transactions"
import { loadOrCreateOHMie } from "./utils/OHMie"

export function handleDeposit(call: DepositCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)

  let transaction = loadOrCreateTransaction(call.transaction)
  
  let deposit = new DaiBondDeposit(transaction.id)
  deposit.transaction = transaction.id
  deposit.ohmie = ohmie.id
  deposit.amount = call.inputs.amount_
  deposit.maxPremium = call.inputs.maxPremium_
  deposit.save()

  ohmie.daiBondTotalDeposit = ohmie.daiBondTotalDeposit.plus(call.inputs.amount_)
  ohmie.save()
}

export function handleRedeem(call: RedeemCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)

  let transaction = loadOrCreateTransaction(call.transaction)
  
  let redeem = new DaiBondRedeem(transaction.id)
  redeem.transaction = transaction.id
  redeem.ohmie = ohmie.id
  redeem.save()
}