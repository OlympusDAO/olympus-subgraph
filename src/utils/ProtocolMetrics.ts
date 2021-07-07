import { Address, BigDecimal, BigInt, log} from '@graphprotocol/graph-ts'
import { OlympusERC20 } from '../../generated/OlympusStakingV1/OlympusERC20';
import { sOlympusERC20 } from '../../generated/OlympusStakingV1/sOlympusERC20';
import { sOlympusERC20V2 } from '../../generated/OlympusStakingV1/sOlympusERC20V2';
import { CirculatingSupply } from '../../generated/OlympusStakingV1/CirculatingSupply';
import { ERC20 } from '../../generated/OlympusStakingV1/ERC20';
import { UniswapV2Pair } from '../../generated/OlympusStakingV1/UniswapV2Pair';
import { MasterChef } from '../../generated/OlympusStakingV1/MasterChef';
import { OlympusStakingV2 } from '../../generated/OlympusStakingV2/OlympusStakingV2';
import { OlympusStakingV1 } from '../../generated/OlympusStakingV1/OlympusStakingV1';

import { ProtocolMetric, Transaction } from '../../generated/schema'
import { CIRCULATING_SUPPLY_CONTRACT, CIRCULATING_SUPPLY_CONTRACT_BLOCK, ERC20DAI_CONTRACT, ERC20FRAX_CONTRACT, OHMDAI_ONSEN_ID, OHM_ERC20_CONTRACT, ONSEN_ALLOCATOR, SOHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACTV2, SOHM_ERC20_CONTRACTV2_BLOCK, STAKING_CONTRACT_V1, STAKING_CONTRACT_V2, STAKING_CONTRACT_V2_BLOCK, SUSHI_MASTERCHEF, SUSHI_OHMDAI_PAIR, TREASURY_ADDRESS, TREASURY_ADDRESS_V2, TREASURY_ADDRESS_V2_BLOCK, UNI_OHMFRAX_PAIR, UNI_OHMFRAX_PAIR_BLOCK } from './Constants';
import { dayFromTimestamp } from './Dates';
import { toDecimal } from './Decimals';
import { getOHMUSDRate, getDiscountedPairUSD, getPairUSD } from './Price';

export function loadOrCreateProtocolMetric(timestamp: BigInt): ProtocolMetric{
    let dayTimestamp = dayFromTimestamp(timestamp);

    let protocolMetric = ProtocolMetric.load(dayTimestamp)
    if (protocolMetric == null) {
        protocolMetric = new ProtocolMetric(dayTimestamp)
        protocolMetric.timestamp = timestamp
        protocolMetric.ohmCirculatingSupply = BigDecimal.fromString("0")
        protocolMetric.sOhmCirculatingSupply = BigDecimal.fromString("0")
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
        protocolMetric.currentAPY = BigDecimal.fromString("0")

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
        pm.ohmCirculatingSupply = toDecimal(circ_supply, 9)
    }
    else{
        pm.ohmCirculatingSupply = pm.totalSupply;
    }

    //sOhm Supply
    if(transaction.blockNumber.gt(BigInt.fromString(SOHM_ERC20_CONTRACTV2_BLOCK))){
        let sohm_contract_v2 = sOlympusERC20V2.bind(Address.fromString(SOHM_ERC20_CONTRACTV2))
        pm.sOhmCirculatingSupply = toDecimal(sohm_contract_v2.circulatingSupply(), 9)
    }
    else{
        let sohm_contract_v1 = sOlympusERC20.bind(Address.fromString(SOHM_ERC20_CONTRACT))
        pm.sOhmCirculatingSupply = toDecimal(sohm_contract_v1.circulatingSupply(), 9)
    }

    //OHM Price
    pm.ohmPrice = getOHMUSDRate()

    //OHM Market Cap
    pm.marketCap = pm.ohmCirculatingSupply.times(pm.ohmPrice)

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
    pm.nextEpochRebase = next_distribution.div(pm.sOhmCirculatingSupply).times(BigDecimal.fromString("100"));
    let nextEpochRebase_number = Number.parseFloat(pm.nextEpochRebase.toString())
    let currentAPY = Math.pow(((nextEpochRebase_number/100)+1), (365*3)-1)*100
    pm.currentAPY = BigDecimal.fromString(currentAPY.toString())

    //Runway
    if(pm.totalOHMstaked.gt(BigDecimal.fromString("0")) && pm.treasuryRiskFreeValue.gt(BigDecimal.fromString("0"))){
        let treasury_runway = Number.parseFloat(pm.treasuryRiskFreeValue.div(pm.totalOHMstaked).toString())

        let runway10k = (Math.log(treasury_runway) / Math.log(1+0.00421449))/3;
        let runway20k = (Math.log(treasury_runway) / Math.log(1+0.00485037))/3;
        let runway50k = (Math.log(treasury_runway) / Math.log(1+0.00569158))/3;
        let runway70k = (Math.log(treasury_runway) / Math.log(1+0.00600065))/3;
        let runway100k = (Math.log(treasury_runway) / Math.log(1+0.00632839))/3;
        let nextEpochRebase_number = Number.parseFloat(pm.nextEpochRebase.toString())/100
        let runwayCurrent = (Math.log(treasury_runway) / Math.log(1+nextEpochRebase_number))/3;

        pm.runway10k = BigDecimal.fromString(runway10k.toString())
        pm.runway20k = BigDecimal.fromString(runway20k.toString())
        pm.runway50k = BigDecimal.fromString(runway50k.toString())
        pm.runway70k = BigDecimal.fromString(runway70k.toString())
        pm.runway100k = BigDecimal.fromString(runway100k.toString())
        pm.runwayCurrent = BigDecimal.fromString(runwayCurrent.toString())

    }

    pm.save()
    
}