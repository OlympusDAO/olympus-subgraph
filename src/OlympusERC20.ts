import { Address, log } from '@graphprotocol/graph-ts'
import { OhmTransaction } from '../generated/schema'

import {  Transfer  } from '../generated/OlympusERC20/OlympusERC20'
import { toDecimal } from "./utils/Decimals"
import { loadOrCreateOHMie } from "./utils/OHMie"
import { loadOrCreateTransaction } from "./utils/Transactions"
import { loadOrCreateRedemption } from './utils/Redemption'
import { DAO_ADDRESS, DISTRIBUTOR_CONTRACT, getBondContracts } from './utils/Constants'

export function handleTransfer(event: Transfer): void {
    let ohmieFrom = loadOrCreateOHMie(event.params.from as Address)
    let ohmieTo = loadOrCreateOHMie(event.params.to as Address)
    let transaction = loadOrCreateTransaction(event.transaction, event.block)
    let value = toDecimal(event.params.value, 9)

    let ohmTx = new OhmTransaction(transaction.id)
    ohmTx.transaction = transaction.id
    ohmTx.ohmieTo = ohmieTo.id
    ohmTx.ohmieFrom = ohmieFrom.id
    ohmTx.amount = value
    ohmTx.timestamp = transaction.timestamp;
    ohmTx.save()

    ohmieTo.ohmBalance = ohmieTo.ohmBalance.plus(value)
    ohmieTo.save()

    ohmieFrom.ohmBalance = ohmieFrom.ohmBalance.minus(value)
    ohmieFrom.save()

    //When the TX comes from any BondContract and is not directed to distributor ot DAO, update the redeem amount as its not present on the redeem call. This could be solved with an event.
    if (getBondContracts().includes(ohmieFrom.id) && !ohmieTo.id.includes(DISTRIBUTOR_CONTRACT) && !ohmieTo.id.includes(DAO_ADDRESS)){
        let redemption = loadOrCreateRedemption(event.transaction.hash as Address)
        redemption.amount = value
        redemption.save()
    }
}