import {  DepositBondPrincipleCall, RedeemBondCall  } from '../generated/OHMPrincipleDepository/OHMPrincipleDepository'
import { Deposit, Redeemtion } from '../generated/schema'
import { loadOrCreateTransaction } from "./utils/Transactions"
import { loadOrCreateOHMie } from "./utils/OHMie"
import { toDecimal } from "./utils/Decimals"
import { OHMDAILPBOND_TOKEN } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { loadOrCreateTreasury } from './utils/Treasuries'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export function handleDeposit(call: DepositBondPrincipleCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)
  let treasury = loadOrCreateTreasury()
  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  
  let amount = toDecimal(call.inputs.amountToDeposit_, 18)
  let deposit = new Deposit(transaction.id)
  deposit.transaction = transaction.id
  deposit.ohmie = ohmie.id
  deposit.amount = amount
  deposit.maxPremium = new BigDecimal(new BigInt(0))
  deposit.token = loadOrCreateToken(OHMDAILPBOND_TOKEN).id;
  deposit.treasury = treasury.id;
  deposit.save()

  ohmie.ohmDaiSlpTotalDeposit = ohmie.ohmDaiSlpTotalDeposit.plus(amount)
  ohmie.save()

  treasury.ohmDaiSlpTotalDeposit = treasury.ohmDaiSlpTotalDeposit.plus(amount)
  treasury.save()
}

export function handleRedeem(call: RedeemBondCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)
  let treasury = loadOrCreateTreasury()
  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  
  let redeem = new Redeemtion(transaction.id)
  redeem.transaction = transaction.id
  redeem.ohmie = ohmie.id
  redeem.token = loadOrCreateToken(OHMDAILPBOND_TOKEN).id;
  redeem.treasury = treasury.id;
  redeem.save()
}