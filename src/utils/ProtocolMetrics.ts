import { Address, BigDecimal, BigInt} from '@graphprotocol/graph-ts'
import { OlympusERC20 } from '../../generated/OlympusStakingV1/OlympusERC20';
import { CirculatingSupply } from '../../generated/OlympusStakingV1/CirculatingSupply';

import { ProtocolMetric, Transaction } from '../../generated/schema'
import { CIRCULATING_SUPPLY_CONTRACT, CIRCULATING_SUPPLY_CONTRACT_BLOCK, OHM_ERC20_CONTRACT } from './Constants';
import { dayFromTimestamp } from './Dates';

export function loadOrCreateProtocolMetric(timestamp: BigInt): ProtocolMetric{
    let dayTimestamp = dayFromTimestamp(timestamp);

    let protocolMetric = ProtocolMetric.load(dayTimestamp)
    if (protocolMetric == null) {
        protocolMetric = new ProtocolMetric(dayTimestamp)
        protocolMetric.timestamp = timestamp
        protocolMetric.circulatingSupply = BigInt.fromString("0")
        protocolMetric.totalSupply = BigInt.fromString("0")
        protocolMetric.save()
    }
    return protocolMetric as ProtocolMetric
}


export function updateProtocolMetrics(transaction: Transaction): void{
    let pm = loadOrCreateProtocolMetric(transaction.timestamp);
    updateSupply(pm, transaction);
    pm.save()
}

function updateSupply(pm: ProtocolMetric, transaction: Transaction): ProtocolMetric{

    let ohm_contract = OlympusERC20.bind(Address.fromString(OHM_ERC20_CONTRACT))
    pm.totalSupply = ohm_contract.totalSupply()

    if(transaction.blockNumber.gt(BigInt.fromString(CIRCULATING_SUPPLY_CONTRACT_BLOCK))){
        let circulatingsupply_contract = CirculatingSupply.bind(Address.fromString(CIRCULATING_SUPPLY_CONTRACT))
        pm.circulatingSupply = circulatingsupply_contract.OHMCirculatingSupply()
    }
    else{
        pm.circulatingSupply = pm.totalSupply;
    }
    
    return pm;
}