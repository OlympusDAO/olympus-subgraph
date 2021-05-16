import { Address } from '@graphprotocol/graph-ts'

import {  Transfer  } from '../generated/sOlympusERC20/sOlympusERC20'
import { toDecimal } from "./utils/Decimals"
import { loadOrCreateOHMie } from "./utils/OHMie"

export function handleTransfer(event: Transfer): void {
    let ohmieFrom = loadOrCreateOHMie(event.transaction.from as Address)
    let ohmieTo = loadOrCreateOHMie(event.transaction.to as Address)
    let value = toDecimal(event.params.value)

    ohmieTo.sohmBalance = ohmieTo.sohmBalance.plus(value)
    ohmieTo.save()
    ohmieFrom.sohmBalance = ohmieFrom.sohmBalance.minus(value)
    ohmieFrom.save()
}