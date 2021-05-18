import { Address } from '@graphprotocol/graph-ts'
import { SohmTransaction } from '../generated/schema'

import {  Transfer  } from '../generated/sOlympusERC20/sOlympusERC20'
import { toDecimal } from "./utils/Decimals"
import { loadOrCreateOHMie } from "./utils/OHMie"
import { loadOrCreateTransaction } from "./utils/Transactions"

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