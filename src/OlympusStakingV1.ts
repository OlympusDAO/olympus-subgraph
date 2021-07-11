import { Address } from '@graphprotocol/graph-ts'
import { Stake, Unstake } from '../generated/schema'

import {  StakeOHMCall, UnstakeOHMCall  } from '../generated/OlympusStakingV1/OlympusStakingV1'
import { toDecimal } from "./utils/Decimals"
import { loadOrCreateOHMie, updateOhmieBalance } from "./utils/OHMie"
import { loadOrCreateTransaction } from "./utils/Transactions"
import { updateProtocolMetrics } from './utils/ProtocolMetrics'

export function handleStake(call: StakeOHMCall): void {
    let ohmie = loadOrCreateOHMie(call.from as Address)
    let transaction = loadOrCreateTransaction(call.transaction, call.block)
    let value = toDecimal(call.inputs.amountToStake_, 9)

    let stake = new Stake(transaction.id)
    stake.transaction = transaction.id
    stake.ohmie = ohmie.id
    stake.amount = value
    stake.timestamp = transaction.timestamp;
    stake.save()

    updateOhmieBalance(ohmie, transaction)
    updateProtocolMetrics(transaction)
}

export function handleUnstake(call: UnstakeOHMCall): void {
    let ohmie = loadOrCreateOHMie(call.from as Address)
    let transaction = loadOrCreateTransaction(call.transaction, call.block)
    let value = toDecimal(call.inputs.amountToWithdraw_, 9)

    let unstake = new Unstake(transaction.id)
    unstake.transaction = transaction.id
    unstake.ohmie = ohmie.id
    unstake.amount = value
    unstake.timestamp = transaction.timestamp;
    unstake.save()

    updateOhmieBalance(ohmie, transaction)
    updateProtocolMetrics(transaction)
}