import {  Transfer  } from '../generated/DAIERC20/DAIERC20'
import { toDecimal } from "./utils/Decimals"
import { loadOrCreateTreasury } from './utils/Treasuries'
import { TREASURY_ADDRESS } from './utils/Constants'
import { Address } from '@graphprotocol/graph-ts'

export function handleTransfer(event: Transfer): void {
    let treasury = loadOrCreateTreasury()
    let value = toDecimal(event.params.wad, 18)
    if (event.params.dst==Address.fromString(TREASURY_ADDRESS)) {
        treasury.daiBalance = treasury.daiBalance.plus(value)
        treasury.save()
    }
    else if (event.params.src==Address.fromString(TREASURY_ADDRESS)) {
        treasury.daiBalance = treasury.daiBalance.minus(value)
        treasury.save()
    }
}