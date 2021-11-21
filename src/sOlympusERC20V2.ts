import { RebaseCall } from '../generated/sOlympusERC20V2/sOlympusERC20V2'
import { OlympusERC20 } from '../generated/sOlympusERC20V2/OlympusERC20'
import { createDailyStakingReward } from './utils/DailyStakingReward'
import { Rebase } from '../generated/schema'
import { Address, BigInt } from '@graphprotocol/graph-ts'
import { OHM_ERC20_CONTRACT, STAKING_CONTRACT_V2 } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { getOHMUSDRate } from './utils/Price';
import { updateProtocolMetrics } from './utils/ProtocolMetrics'

export function rebaseFunction(call: RebaseCall): void {
    var rebase = Rebase.load(call.block.timestamp.toString())

    if (rebase == null && call.inputs.profit_.gt(BigInt.fromI32(0))) {
        let ohm_contract = OlympusERC20.bind(Address.fromString(OHM_ERC20_CONTRACT))

        rebase = new Rebase(call.block.timestamp.toString())
        rebase.amount = toDecimal(call.inputs.profit_, 9)
        rebase.stakedOhms = toDecimal(ohm_contract.balanceOf(Address.fromString(STAKING_CONTRACT_V2)), 9)
        rebase.contract = STAKING_CONTRACT_V2
        rebase.percentage = rebase.amount.div(rebase.stakedOhms)
        rebase.timestamp = call.block.timestamp
        rebase.value = rebase.amount.times(getOHMUSDRate())
        rebase.save()

        createDailyStakingReward(rebase.timestamp, rebase.amount)
        updateProtocolMetrics(call.block)
    }
}