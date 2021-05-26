import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { SohmTransaction, Rebase } from '../generated/schema'

import {  Transfer, RebaseCall } from '../generated/sOlympusERC20/sOlympusERC20'
import { STAKING_CONTRACT, OHM_ERC20_CONTRACT } from './utils/Constants'
import { createDailyStackingReward } from './utils/DailyStackingReward'
import { toDecimal } from "./utils/Decimals"
import { loadOrCreateOHMie } from "./utils/OHMie"
import { loadOrCreateTransaction } from "./utils/Transactions"
import { loadOrCreateTreasury } from './utils/Treasuries'
import { OlympusERC20 } from '../generated/OlympusERC20/OlympusERC20'

export function handleTransfer(event: Transfer): void {
    let ohmieFrom = loadOrCreateOHMie(event.params.from as Address)
    let ohmieTo = loadOrCreateOHMie(event.params.to as Address)
    let transaction = loadOrCreateTransaction(event.transaction, event.block)
    let value = toDecimal(event.params.value, 9)

    let sohmTx = new SohmTransaction(transaction.id)
    sohmTx.transaction = transaction.id
    sohmTx.ohmieTo = ohmieTo.id
    sohmTx.ohmieFrom = ohmieFrom.id
    sohmTx.amount = value
    sohmTx.timestamp = transaction.timestamp;
    sohmTx.save()

    ohmieTo.sohmBalance = ohmieTo.sohmBalance.plus(value)
    ohmieTo.save()

    ohmieFrom.sohmBalance = ohmieFrom.sohmBalance.minus(value)
    ohmieFrom.save()
}

export function rebaseFunction(call: RebaseCall): void {
    let transaction = loadOrCreateTransaction(call.transaction, call.block)
    let treasury = loadOrCreateTreasury()

    let rebase = Rebase.load(transaction.id)
    if (rebase == null && call.inputs.olyProfit.gt(new BigInt(0))) {

        let staking_contract = OlympusERC20.bind(Address.fromString(OHM_ERC20_CONTRACT))

        rebase = new Rebase(transaction.id)
        rebase.amount = toDecimal(call.inputs.olyProfit, 9)
        rebase.percentage = rebase.amount.div(toDecimal(staking_contract.balanceOf(Address.fromString(STAKING_CONTRACT)), 9)).times(new BigDecimal(new BigInt(100)))
        rebase.transaction = transaction.id
        rebase.timestamp = transaction.timestamp
        rebase.save()

        createDailyStackingReward(rebase.timestamp, rebase.amount, treasury)

    }
}