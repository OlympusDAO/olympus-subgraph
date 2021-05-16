import { Address  } from '@graphprotocol/graph-ts'

import {  Transfer  } from '../generated/OHMDAIERC20/OHMDAIERC20'
import { toDecimal } from "./utils/Decimals"
import { loadOrCreateTreasury } from './utils/Treasuries'
import { TREASURY_ADDRESS, SUSHI_OHMDAI_PAIR } from './utils/Constants'



export function handleTransfer(event: Transfer): void {
    let treasury = loadOrCreateTreasury()
    let value = toDecimal(event.params.value)

    if (event.params.to==Address.fromString(TREASURY_ADDRESS)) {
        treasury.ohmDaiSlpBalance = treasury.ohmDaiSlpBalance.plus(value)
        treasury.save()
    }
    else if (event.params.from==Address.fromString(TREASURY_ADDRESS)) {
        treasury.ohmDaiSlpBalance = treasury.ohmDaiSlpBalance.minus(value)
        treasury.save()
    }
}