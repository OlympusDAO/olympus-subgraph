import { Address, log } from '@graphprotocol/graph-ts'
import { OhmTransaction } from '../generated/schema'

import {  Transfer  } from '../generated/OlympusERC20/OlympusERC20'
import { toDecimal } from "./utils/Decimals"
import { loadOrCreateOHMie } from "./utils/OHMie"
import { loadOrCreateTransaction } from "./utils/Transactions"
import { loadOrCreateRedemption } from './utils/Redemption'
import { DAIBOND_CONTRACTS, OHMDAISLPBOND_CONTRACT1, OHMDAISLPBOND_CONTRACT2} from './utils/Constants'

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

    log.debug("1234567890 TX From {}  TX To {} TX {}   DAI contract {} SLP1 {} SLP2 {}", [ohmieFrom.id, ohmieTo.id, event.transaction.hash.toHex(), DAIBOND_CONTRACTS, OHMDAISLPBOND_CONTRACT1, OHMDAISLPBOND_CONTRACT2])
    //When the TX comes from the BondContract, update the redeem amount as its not present on the redeem call
    if ((ohmieFrom.id.includes(DAIBOND_CONTRACTS) || ohmieFrom.id.includes(OHMDAISLPBOND_CONTRACT1) || ohmieFrom.id.includes(OHMDAISLPBOND_CONTRACT2)) && !ohmieTo.id.includes("0xbe731507810c8747c3e01e62c676b1ca6f93242f") && !ohmieTo.id.includes("0x245cc372c84b3645bf0ffe6538620b04a217988b")){
        log.debug("1234567890 Created redemption {} ", [event.transaction.hash.toHex()])

        let redemption = loadOrCreateRedemption(event.transaction.hash as Address)
        redemption.amount = value
        redemption.save()
    }
}