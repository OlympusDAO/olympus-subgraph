import {  DepositCall, RedeemCall  } from '../generated/DAIBondDepository.sol/DAIBondDepository'
import { OHMie, DAIBondDeposit, DAIBondRedeem } from '../generated/schema'
import { loadOrCreateTransaction } from "./utils/Transaction"

export function handleDeposit(call: DepositCall): void {
  let user = loadOHMieOrCreate(call)

  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  
  let deposit = new DAIBondDeposit(transaction.id)
  deposit.transaction = transaction.id
  deposit.user = user.id
  deposit.amount = call.inputs.amount_
  deposit.maxPremium = call.inputs.maxPremium_
  deposit.save()
}

export function handleRedeem(call: RedeemCall): void {
  let user = loadOHMieOrCreate(call)

  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  
  let redeem = new DAIBondRedeem(transaction.id)
  redeem.transaction = transaction.id
  redeem.user = user.id
  redeem.save()
}

function loadOHMieOrCreate(addres){
  let user = OHMie.load(addres)
  if (user == null) {
    user = new OHMie(addres)
    user.save()
  }
  return user
}