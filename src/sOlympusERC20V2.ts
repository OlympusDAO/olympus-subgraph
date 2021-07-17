import { RebaseCall } from '../generated/sOlympusERC20V2/sOlympusERC20V2'
import { OlympusERC20 } from '../generated/sOlympusERC20V2/OlympusERC20'
import { createDailyStakingReward } from './utils/DailyStakingReward'
import { loadOrCreateTransaction } from "./utils/Transactions"
import { Rebase } from '../generated/schema'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { OHM_ERC20_CONTRACT, STAKING_CONTRACT_V2 } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { getOHMUSDRate } from './utils/Price';

export function rebaseFunction(call: RebaseCall): void {
    let transaction = loadOrCreateTransaction(call.transaction, call.block)
    var rebase = Rebase.load(transaction.id)
    log.debug("Rebase_V2 event on TX {} with amount {}", [transaction.id, toDecimal(call.inputs.profit_, 9).toString()])

    if (rebase == null && call.inputs.profit_.gt(BigInt.fromI32(0))) {
        let ohm_contract = OlympusERC20.bind(Address.fromString(OHM_ERC20_CONTRACT))

        rebase = new Rebase(transaction.id)
        rebase.amount = toDecimal(call.inputs.profit_, 9)
        rebase.stakedOhms = toDecimal(ohm_contract.balanceOf(Address.fromString(STAKING_CONTRACT_V2)), 9)
        rebase.contract = STAKING_CONTRACT_V2
        rebase.percentage = rebase.amount.div(rebase.stakedOhms)
        rebase.transaction = transaction.id
        rebase.timestamp = transaction.timestamp
        rebase.value = rebase.amount.times(getOHMUSDRate())
        rebase.save()

        createDailyStakingReward(rebase.timestamp, rebase.amount)
    }
}