import { Address } from '@graphprotocol/graph-ts'
import { sohmTransaction } from '../generated/schema'

import {  Transfer  } from '../generated/OlympusERC20/OlympusERC20'
import { toDecimal } from "./utils/Decimals"
import { loadOrCreateOHMie } from "./utils/OHMie"
import { loadOrCreateTransaction } from "./utils/Transactions"

export function handleTransfer(event: Transfer): void {
    let ohmieFrom = loadOrCreateOHMie(event.transaction.from as Address)
    let ohmieTo = loadOrCreateOHMie(event.transaction.to as Address)
    let transaction = loadOrCreateTransaction(event.transaction, event.block)
    let value = toDecimal(event.params.value, 9)

    ohmieTo.ohmBalance = ohmieTo.ohmBalance.plus(value)
    ohmieTo.save()
    let toTx = new sohmTransaction(transaction.id)
    toTx.transaction = transaction.id
    toTx.ohmie = ohmieTo.id
    toTx.amount = value
    toTx.action = "Receive"
    toTx.save()

    ohmieFrom.ohmBalance = ohmieFrom.ohmBalance.minus(value)
    ohmieFrom.save()
    let fromTx = new sohmTransaction(transaction.id)
    fromTx.transaction = transaction.id
    fromTx.ohmie = ohmieTo.id
    fromTx.amount = value
    fromTx.action = "Send"
    fromTx.save()
}