import {  DepositBondPrincipleCall, RedeemBondCall  } from '../generated/OHMPrincipleDepository/OHMPrincipleDepository'
import { Deposit, Redemption } from '../generated/schema'
import { loadOrCreateTransaction } from "./utils/Transactions"
import { loadOrCreateOHMie } from "./utils/OHMie"
import { toDecimal } from "./utils/Decimals"
import { OHMDAILPBOND_TOKEN } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { loadOrCreateTreasury } from './utils/Treasuries'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { createDailyBondRecord } from './utils/DailyBond'

export function handleDeposit(call: DepositBondPrincipleCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)
  let treasury = loadOrCreateTreasury()
  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  let token = loadOrCreateToken(OHMDAILPBOND_TOKEN)

  let amount = toDecimal(call.inputs.amountToDeposit_, 18)
  let deposit = new Deposit(transaction.id)
  deposit.transaction = transaction.id
  deposit.ohmie = ohmie.id
  deposit.amount = amount
  deposit.maxPremium = new BigDecimal(new BigInt(0))
  deposit.token = token.id;
  deposit.treasury = treasury.id;
  deposit.timestamp = transaction.timestamp;
  deposit.save()

  ohmie.ohmDaiSlpTotalDeposit = ohmie.ohmDaiSlpTotalDeposit.plus(amount)
  ohmie.save()

  treasury.ohmDaiSlpTotalDeposit = treasury.ohmDaiSlpTotalDeposit.plus(amount)
  treasury.save()

  createDailyBondRecord(deposit.timestamp, token, deposit.amount, treasury)
}

export function handleRedeem(call: RedeemBondCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)
  let treasury = loadOrCreateTreasury()
  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  
  let redemption = Redemption.load(transaction.id)
  if (redemption==null){
    redemption = new Redemption(transaction.id)
  }
  redemption.transaction = transaction.id
  redemption.ohmie = ohmie.id
  redemption.token = loadOrCreateToken(OHMDAILPBOND_TOKEN).id;
  redemption.treasury = treasury.id;
  redemption.timestamp = transaction.timestamp;
  redemption.save()
}