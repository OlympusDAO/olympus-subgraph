import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

import { DailyStackingReward, Token, Treasury } from '../../generated/schema'
import { dayFromTimestamp } from './Dates';

export function loadOrCreateDailyStackingReward(timestamp: BigInt, treasury: Treasury): DailyStackingReward{
    let day_timestamp = dayFromTimestamp(timestamp)
    let id = day_timestamp+token.name
    let dailySR = DailyStackingReward.load(id)
    if (dailySR == null) {
        dailySR = new DailyStackingReward(id)
        dailySR.amount = new BigDecimal(new BigInt(0))
        dailySR.treasury = treasury.id
        dailySR.timestamp = BigInt.fromString(day_timestamp)
        dailySR.save()
    }
    return dailySR as DailyStackingReward
}

export function createDailyStackingReward(timestamp: BigInt, amount: BigDecimal, treasury: Treasury): void{
    let dailySR = loadOrCreateDailyStackingReward(timestamp, treasury)
    dailySR.amount = dailySR.amount.plus(amount)
    dailySR.save()
}