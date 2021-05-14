import {  DepositCall, RedeemCall  } from '../generated/DAIBondDepository.sol/DAIBondDepository'
import { DAIBondDeposit, DAIBondRedeem } from '../generated/schema'
import { loadOrCreateTransaction } from "./utils/Transactions"
import { loadOrCreateOHMie } from "./utils/OHMie"

export function handleDeposit(call: DepositCall): void {
  let user = loadOrCreateOHMie(call.transaction.from)

  let transaction = loadOrCreateTransaction(call.transaction)
  
  let deposit = new DAIBondDeposit(transaction.id)
  deposit.transaction = transaction.id
  deposit.user = user.id
  deposit.amount = call.inputs.amount_
  deposit.maxPremium = call.inputs.maxPremium_
  deposit.save()
}

export function handleRedeem(call: RedeemCall): void {
  let user = loadOrCreateOHMie(call.transaction.from)

  let transaction = loadOrCreateTransaction(call.transaction)
  
  let redeem = new DAIBondRedeem(transaction.id)
  redeem.transaction = transaction.id
  redeem.user = user.id
  redeem.save()
}