import { Address, BigDecimal, BigInt, log} from '@graphprotocol/graph-ts'
import { OlympusERC20 } from '../../generated/OlympusStakingV1/OlympusERC20';
import { CirculatingSupply } from '../../generated/OlympusStakingV1/CirculatingSupply';
import { ERC20 } from '../../generated/OlympusStakingV1/ERC20';
import { UniswapV2Pair } from '../../generated/OlympusStakingV1/UniswapV2Pair';
import { MasterChef } from '../../generated/OlympusStakingV1/MasterChef';
import { OlympusStakingV2 } from '../../generated/OlympusStakingV2/OlympusStakingV2';
import { OlympusStakingV1 } from '../../generated/OlympusStakingV1/OlympusStakingV1';

import { ProtocolMetric, Transaction } from '../../generated/schema'
import { CIRCULATING_SUPPLY_CONTRACT, CIRCULATING_SUPPLY_CONTRACT_BLOCK, ERC20DAI_CONTRACT, ERC20FRAX_CONTRACT, OHMDAI_ONSEN_ID, OHM_ERC20_CONTRACT, ONSEN_ALLOCATOR, STAKING_CONTRACT_V1, STAKING_CONTRACT_V2, STAKING_CONTRACT_V2_BLOCK, SUSHI_MASTERCHEF, SUSHI_OHMDAI_PAIR, TREASURY_ADDRESS, TREASURY_ADDRESS_V2, TREASURY_ADDRESS_V2_BLOCK, UNI_OHMFRAX_PAIR, UNI_OHMFRAX_PAIR_BLOCK } from './Constants';
import { dayFromTimestamp } from './Dates';
import { toDecimal } from './Decimals';
import { getOHMUSDRate, getDiscountedPairUSD, getPairUSD } from './Price';

export function loadOrCreateProtocolMetric(timestamp: BigInt): ProtocolMetric{
    let dayTimestamp = dayFromTimestamp(timestamp);

    let protocolMetric = ProtocolMetric.load(dayTimestamp)
    if (protocolMetric == null) {
        protocolMetric = new ProtocolMetric(dayTimestamp)
        protocolMetric.timestamp = timestamp
        protocolMetric.circulatingSupply = BigDecimal.fromString("0")
        protocolMetric.totalSupply = BigDecimal.fromString("0")
        protocolMetric.ohmPrice = BigDecimal.fromString("0")
        protocolMetric.marketCap = BigDecimal.fromString("0")
        protocolMetric.totalValueLocked = BigDecimal.fromString("0")
        protocolMetric.totalOHMstaked = BigDecimal.fromString("0")
        protocolMetric.treasuryRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiValue = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiLPValue = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiLPRFV = BigDecimal.fromString("0")
        protocolMetric.treasuryFraxValue = BigDecimal.fromString("0")
        protocolMetric.treasuryFraxLPValue = BigDecimal.fromString("0")
        protocolMetric.treasuryFraxLPRFV = BigDecimal.fromString("0")
        protocolMetric.totalOhmDaiLPSupply = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmDaiLPSupply = BigDecimal.fromString("0")
        protocolMetric.totalOhmFraxLPSupply = BigDecimal.fromString("0")
        protocolMetric.treasuryOHMFraxLPSupply = BigDecimal.fromString("0")
        protocolMetric.nextEpochRebase = BigDecimal.fromString("0")

        protocolMetric.save()
    }
    return protocolMetric as ProtocolMetric
}


export function updateProtocolMetrics(transaction: Transaction): void{
    let pm = loadOrCreateProtocolMetric(transaction.timestamp);

    //Total Supply
    let ohm_contract = OlympusERC20.bind(Address.fromString(OHM_ERC20_CONTRACT))
    pm.totalSupply = toDecimal(ohm_contract.totalSupply(), 9)

    //Circ Supply
    if(transaction.blockNumber.gt(BigInt.fromString(CIRCULATING_SUPPLY_CONTRACT_BLOCK))){
        let circulatingsupply_contract = CirculatingSupply.bind(Address.fromString(CIRCULATING_SUPPLY_CONTRACT))
        let circ_supply = circulatingsupply_contract.OHMCirculatingSupply()
        pm.circulatingSupply = toDecimal(circ_supply, 9)
    }
    else{
        pm.circulatingSupply = pm.totalSupply;
    }

    //OHM Price
    pm.ohmPrice = getOHMUSDRate()

    //OHM Market Cap
    pm.marketCap = pm.circulatingSupply.times(pm.ohmPrice)

    //Total Value Locked
    let v1balance = toDecimal(ohm_contract.balanceOf(Address.fromString(STAKING_CONTRACT_V1)), 9)
    let v2balance = toDecimal(ohm_contract.balanceOf(Address.fromString(STAKING_CONTRACT_V2)), 9)
    pm.totalOHMstaked = v1balance.plus(v2balance)
    pm.totalValueLocked = pm.totalOHMstaked.times(pm.ohmPrice)

    //Treasury RFV and MV
    let daiERC20 = ERC20.bind(Address.fromString(ERC20DAI_CONTRACT))
    let fraxERC20 = ERC20.bind(Address.fromString(ERC20FRAX_CONTRACT))
    let ohmdaiPair = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMDAI_PAIR))
    let ohmdaiOnsenMC = MasterChef.bind(Address.fromString(SUSHI_MASTERCHEF))
    let ohmfraxPair = UniswapV2Pair.bind(Address.fromString(UNI_OHMFRAX_PAIR))

    let treasury_address = TREASURY_ADDRESS;
    if(transaction.blockNumber.gt(BigInt.fromString(TREASURY_ADDRESS_V2_BLOCK))){
        treasury_address = TREASURY_ADDRESS_V2;
    }

    let daiBalance = daiERC20.balanceOf(Address.fromString(treasury_address))
    let fraxBalance = fraxERC20.balanceOf(Address.fromString(treasury_address))
    let ohmdaiSushiBalance = ohmdaiPair.balanceOf(Address.fromString(treasury_address))
    let ohmdaiOnsenBalance = ohmdaiOnsenMC.userInfo(BigInt.fromI32(OHMDAI_ONSEN_ID), Address.fromString(ONSEN_ALLOCATOR)).value0
    let ohmdaiBalance = ohmdaiSushiBalance.plus(ohmdaiOnsenBalance)
    let ohmdai_value = getPairUSD(ohmdaiBalance, SUSHI_OHMDAI_PAIR)
    let ohmdai_rfv = getDiscountedPairUSD(ohmdaiBalance, SUSHI_OHMDAI_PAIR)

    let ohmfraxBalance = BigInt.fromI32(0)
    let ohmfrax_value = BigDecimal.fromString("0")
    let ohmfrax_rfv = BigDecimal.fromString("0")
    if(transaction.blockNumber.gt(BigInt.fromString(UNI_OHMFRAX_PAIR_BLOCK))){
        ohmfraxBalance = ohmfraxPair.balanceOf(Address.fromString(treasury_address))
        ohmfrax_value = getPairUSD(ohmfraxBalance, UNI_OHMFRAX_PAIR)
        ohmfrax_rfv = getDiscountedPairUSD(ohmfraxBalance, UNI_OHMFRAX_PAIR)
    }

    let stableValue = daiBalance.plus(fraxBalance)
    let stableValueDecimal = toDecimal(stableValue, 18)

    let lpValue = ohmdai_value.plus(ohmfrax_value)
    let rfvLpValue = ohmdai_rfv.plus(ohmfrax_rfv)

    pm.treasuryMarketValue = stableValueDecimal.plus(lpValue)
    pm.treasuryRiskFreeValue = stableValueDecimal.plus(rfvLpValue)

    pm.treasuryDaiValue = toDecimal(daiBalance, 18)
    pm.treasuryDaiLPValue = ohmdai_value
    pm.treasuryDaiLPRFV = ohmdai_rfv
    pm.treasuryFraxValue = toDecimal(fraxBalance, 18)
    pm.treasuryFraxLPValue = ohmfrax_value
    pm.treasuryFraxLPRFV = ohmfrax_rfv
    pm.totalOhmDaiLPSupply = toDecimal(ohmdaiPair.totalSupply(),18)
    pm.treasuryOhmDaiLPSupply = toDecimal(ohmdaiBalance,18)
    pm.totalOhmFraxLPSupply = toDecimal(ohmdaiPair.totalSupply(),18)
    pm.treasuryOHMFraxLPSupply = toDecimal(ohmfraxBalance,18)

    // Rebase rewards
    let next_distribution = BigDecimal.fromString("0")
    if(transaction.blockNumber.lt(BigInt.fromString(STAKING_CONTRACT_V2_BLOCK))){
        let staking_contract_v1 = OlympusStakingV1.bind(Address.fromString(STAKING_CONTRACT_V1))   
        next_distribution = toDecimal(staking_contract_v1.ohmToDistributeNextEpoch(),9) 
    }
    else{
        let staking_contract_v2 = OlympusStakingV2.bind(Address.fromString(STAKING_CONTRACT_V2))
        next_distribution = toDecimal(staking_contract_v2.epoch().value3,9) 
    }
    pm.nextEpochRebase = next_distribution.div(pm.circulatingSupply).times(BigDecimal.fromString("100"));

    pm.save()
    
}