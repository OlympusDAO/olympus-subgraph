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
import { AAVE_ALLOCATOR, ADAI_ERC20_CONTRACT, CIRCULATING_SUPPLY_CONTRACT, CIRCULATING_SUPPLY_CONTRACT_BLOCK, ERC20DAI_CONTRACT, ERC20FRAX_CONTRACT, OHMDAI_ONSEN_ID, OHM_ERC20_CONTRACT, ONSEN_ALLOCATOR, SOHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACTV2, SOHM_ERC20_CONTRACTV2_BLOCK, STAKING_CONTRACT_V1, STAKING_CONTRACT_V2, STAKING_CONTRACT_V2_BLOCK, SUSHI_MASTERCHEF, SUSHI_OHMDAI_PAIR, TREASURY_ADDRESS, TREASURY_ADDRESS_V2, TREASURY_ADDRESS_V2_BLOCK, UNI_OHMFRAX_PAIR, UNI_OHMFRAX_PAIR_BLOCK, XSUSI_ERC20_CONTRACT } from './Constants';
import { dayFromTimestamp } from './Dates';
import { toDecimal } from './Decimals';
import { getOHMUSDRate, getDiscountedPairUSD, getPairUSD, getXsushiUSDRate } from './Price';
import { getHolderAux } from './Aux';

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
        protocolMetric.treasuryRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryMarketValue = BigDecimal.fromString("0")
        protocolMetric.nextEpochRebase = BigDecimal.fromString("0")
        protocolMetric.nextDistributedOhm = BigDecimal.fromString("0")
        protocolMetric.currentAPY = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryFraxRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryFraxMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryXsushiMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmDaiPOL = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmFraxPOL = BigDecimal.fromString("0")
        protocolMetric.holders = BigInt.fromI32(0)

        protocolMetric.save()
    }
    return protocolMetric as ProtocolMetric
}


function getTotalSupply(): BigDecimal{
    let ohm_contract = OlympusERC20.bind(Address.fromString(OHM_ERC20_CONTRACT))
    let total_supply = toDecimal(ohm_contract.totalSupply(), 9)
    log.debug("Total Supply {}", [total_supply.toString()])
    return total_supply
}

function getCriculatingSupply(transaction: Transaction, total_supply: BigDecimal): BigDecimal{
    let circ_supply = BigDecimal.fromString("0")
    if(transaction.blockNumber.gt(BigInt.fromString(CIRCULATING_SUPPLY_CONTRACT_BLOCK))){
        let circulatingsupply_contract = CirculatingSupply.bind(Address.fromString(CIRCULATING_SUPPLY_CONTRACT))
        circ_supply = toDecimal(circulatingsupply_contract.OHMCirculatingSupply(), 9)
    }
    else{
        circ_supply = total_supply;
    }
    log.debug("Circulating Supply {}", [total_supply.toString()])
    return circ_supply
}

function getSohmSupply(transaction: Transaction): BigDecimal{
    let sohm_supply = BigDecimal.fromString("0")

    let sohm_contract_v1 = sOlympusERC20.bind(Address.fromString(SOHM_ERC20_CONTRACT))
    sohm_supply = toDecimal(sohm_contract_v1.circulatingSupply(), 9)
    
    if(transaction.blockNumber.gt(BigInt.fromString(SOHM_ERC20_CONTRACTV2_BLOCK))){
        let sohm_contract_v2 = sOlympusERC20V2.bind(Address.fromString(SOHM_ERC20_CONTRACTV2))
        sohm_supply = sohm_supply.plus(toDecimal(sohm_contract_v2.circulatingSupply(), 9))
    }
    
    log.debug("sOHM Supply {}", [sohm_supply.toString()])
    return sohm_supply
}

function getMV_RFV(transaction: Transaction): BigDecimal[]{
    let daiERC20 = ERC20.bind(Address.fromString(ERC20DAI_CONTRACT))
    let fraxERC20 = ERC20.bind(Address.fromString(ERC20FRAX_CONTRACT))
    let aDaiERC20 = ERC20.bind(Address.fromString(ADAI_ERC20_CONTRACT))
    let xSushiERC20 = ERC20.bind(Address.fromString(XSUSI_ERC20_CONTRACT))

    let ohmdaiPair = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMDAI_PAIR))
    let ohmdaiOnsenMC = MasterChef.bind(Address.fromString(SUSHI_MASTERCHEF))
    let ohmfraxPair = UniswapV2Pair.bind(Address.fromString(UNI_OHMFRAX_PAIR))

    let treasury_address = TREASURY_ADDRESS;
    if(transaction.blockNumber.gt(BigInt.fromString(TREASURY_ADDRESS_V2_BLOCK))){
        treasury_address = TREASURY_ADDRESS_V2;
    }

    let daiBalance = daiERC20.balanceOf(Address.fromString(treasury_address))
    let adaiBalance = aDaiERC20.balanceOf(Address.fromString(AAVE_ALLOCATOR))
    let fraxBalance = fraxERC20.balanceOf(Address.fromString(treasury_address))
    let xSushiBalance = xSushiERC20.balanceOf(Address.fromString(treasury_address))
    let xSushi_value = toDecimal(xSushiBalance, 18).times(getXsushiUSDRate())

    let ohmdaiSushiBalance = ohmdaiPair.balanceOf(Address.fromString(treasury_address))
    let ohmdaiOnsenBalance = ohmdaiOnsenMC.userInfo(BigInt.fromI32(OHMDAI_ONSEN_ID), Address.fromString(ONSEN_ALLOCATOR)).value0
    let ohmdaiBalance = ohmdaiSushiBalance.plus(ohmdaiOnsenBalance)
    let ohmdaiTotalLP = toDecimal(ohmdaiPair.totalSupply(), 18)
    let ohmdaiPOL = toDecimal(ohmdaiBalance, 18).div(ohmdaiTotalLP).times(BigDecimal.fromString("100"))
    let ohmdai_value = getPairUSD(ohmdaiBalance, SUSHI_OHMDAI_PAIR)
    let ohmdai_rfv = getDiscountedPairUSD(ohmdaiBalance, SUSHI_OHMDAI_PAIR)

    let ohmfraxBalance = BigInt.fromI32(0)
    let ohmfrax_value = BigDecimal.fromString("0")
    let ohmfrax_rfv = BigDecimal.fromString("0")
    let ohmfraxTotalLP = BigDecimal.fromString("0")
    let ohmfraxPOL = BigDecimal.fromString("0")
    if(transaction.blockNumber.gt(BigInt.fromString(UNI_OHMFRAX_PAIR_BLOCK))){
        ohmfraxBalance = ohmfraxPair.balanceOf(Address.fromString(treasury_address))
        ohmfrax_value = getPairUSD(ohmfraxBalance, UNI_OHMFRAX_PAIR)
        ohmfrax_rfv = getDiscountedPairUSD(ohmfraxBalance, UNI_OHMFRAX_PAIR)
        if (ohmfraxTotalLP.gt(BigDecimal.fromString("0")) &&  ohmfraxBalance.gt(BigInt.fromI32(0))){
            ohmdaiTotalLP = toDecimal(ohmfraxPair.totalSupply(), 18)
            ohmfraxPOL = toDecimal(ohmfraxBalance, 18).div(ohmfraxTotalLP).times(BigDecimal.fromString("100"))
        }
    }

    let stableValue = daiBalance.plus(fraxBalance).plus(adaiBalance)
    let stableValueDecimal = toDecimal(stableValue, 18)

    let lpValue = ohmdai_value.plus(ohmfrax_value)
    let rfvLpValue = ohmdai_rfv.plus(ohmfrax_rfv)

    let mv = stableValueDecimal.plus(lpValue).plus(xSushi_value)
    let rfv = stableValueDecimal.plus(rfvLpValue)

    log.debug("Treasury Market Value {}", [mv.toString()])
    log.debug("Treasury RFV {}", [rfv.toString()])
    log.debug("Treasury DAI value {}", [toDecimal(daiBalance, 18).toString()])
    log.debug("Treasury aDAI value {}", [toDecimal(adaiBalance, 18).toString()])
    log.debug("Treasury xSushi value {}", [xSushi_value.toString()])
    log.debug("Treasury OHM-DAI RFV {}", [ohmdai_rfv.toString()])
    log.debug("Treasury Frax value {}", [toDecimal(fraxBalance, 18).toString()])
    log.debug("Treasury OHM-FRAX RFV {}", [ohmfrax_rfv.toString()])

    return [
        mv, 
        rfv,
        // treasuryDaiRiskFreeValue = DAI RFV * DAI + aDAI
        ohmdai_rfv.plus(toDecimal(daiBalance, 18)).plus(toDecimal(adaiBalance, 18)),
        // treasuryFraxRiskFreeValue = FRAX RFV * FRAX
        ohmfrax_rfv.plus(toDecimal(fraxBalance, 18)),
        // treasuryDaiMarketValue = DAI LP * DAI + aDAI
        ohmdai_value.plus(toDecimal(daiBalance, 18)).plus(toDecimal(adaiBalance, 18)),
        // treasuryFraxMarketValue = FRAX LP * FRAX
        ohmfrax_value.plus(toDecimal(fraxBalance, 18)),
        xSushi_value,
        // POL
        ohmdaiPOL,
        ohmfraxPOL
    ]
}

function getNextOHMRebase(transaction: Transaction): BigDecimal{
    let next_distribution = BigDecimal.fromString("0")

    let staking_contract_v1 = OlympusStakingV1.bind(Address.fromString(STAKING_CONTRACT_V1))   
    let response = staking_contract_v1.try_ohmToDistributeNextEpoch()
    if(response.reverted==false){
        next_distribution = toDecimal(response.value,9)
        log.debug("next_distribution v1 {}", [next_distribution.toString()])
    }
    else{
        log.debug("reverted staking_contract_v1", []) 
    }

    if(transaction.blockNumber.gt(BigInt.fromString(STAKING_CONTRACT_V2_BLOCK))){
        let staking_contract_v2 = OlympusStakingV2.bind(Address.fromString(STAKING_CONTRACT_V2))
        let distribution_v2 = toDecimal(staking_contract_v2.epoch().value3,9)
        log.debug("next_distribution v2 {}", [distribution_v2.toString()])
        next_distribution = next_distribution.plus(distribution_v2)
    }

    log.debug("next_distribution total {}", [next_distribution.toString()])

    return next_distribution
}

function getAPY_Rebase(sOHM: BigDecimal, distributedOHM: BigDecimal): BigDecimal[]{
    let nextEpochRebase = distributedOHM.div(sOHM).times(BigDecimal.fromString("100"));

    let nextEpochRebase_number = Number.parseFloat(nextEpochRebase.toString())
    let currentAPY = Math.pow(((nextEpochRebase_number/100)+1), (365*3)-1)*100

    let currentAPYdecimal = BigDecimal.fromString(currentAPY.toString())

    log.debug("next_rebase {}", [nextEpochRebase.toString()])
    log.debug("current_apy total {}", [currentAPYdecimal.toString()])

    return [currentAPYdecimal, nextEpochRebase]
}

function getRunway(sOHM: BigDecimal, rfv: BigDecimal, rebase: BigDecimal): BigDecimal[]{
    let runway10k = BigDecimal.fromString("0")
    let runway20k = BigDecimal.fromString("0")
    let runway50k = BigDecimal.fromString("0")
    let runway70k = BigDecimal.fromString("0")
    let runway100k = BigDecimal.fromString("0")
    let runwayCurrent = BigDecimal.fromString("0")

    if(sOHM.gt(BigDecimal.fromString("0")) && rfv.gt(BigDecimal.fromString("0")) &&  rebase.gt(BigDecimal.fromString("0"))){
        let treasury_runway = Number.parseFloat(rfv.div(sOHM).toString())

        let runway10k_num = (Math.log(treasury_runway) / Math.log(1+0.00421449))/3;
        let runway20k_num = (Math.log(treasury_runway) / Math.log(1+0.00485037))/3;
        let runway50k_num = (Math.log(treasury_runway) / Math.log(1+0.00569158))/3;
        let runway70k_num = (Math.log(treasury_runway) / Math.log(1+0.00600065))/3;
        let runway100k_num = (Math.log(treasury_runway) / Math.log(1+0.00632839))/3;
        let nextEpochRebase_number = Number.parseFloat(rebase.toString())/100
        let runwayCurrent_num = (Math.log(treasury_runway) / Math.log(1+nextEpochRebase_number))/3;

        runway10k = BigDecimal.fromString(runway10k_num.toString())
        runway20k = BigDecimal.fromString(runway20k_num.toString())
        runway50k = BigDecimal.fromString(runway50k_num.toString())
        runway70k = BigDecimal.fromString(runway70k_num.toString())
        runway100k = BigDecimal.fromString(runway100k_num.toString())
        runwayCurrent = BigDecimal.fromString(runwayCurrent_num.toString())
    }

    return [runway10k, runway20k, runway50k, runway70k, runway100k, runwayCurrent]
}


export function updateProtocolMetrics(transaction: Transaction): void{
    let pm = loadOrCreateProtocolMetric(transaction.timestamp);

    //Total Supply
    pm.totalSupply = getTotalSupply()

    //Circ Supply
    pm.ohmCirculatingSupply = getCriculatingSupply(transaction, pm.totalSupply)

    //sOhm Supply
    pm.sOhmCirculatingSupply = getSohmSupply(transaction)

    //OHM Price
    pm.ohmPrice = getOHMUSDRate()

    //OHM Market Cap
    pm.marketCap = pm.ohmCirculatingSupply.times(pm.ohmPrice)

    //Total Value Locked
    pm.totalValueLocked = pm.sOhmCirculatingSupply.times(pm.ohmPrice)

    //Treasury RFV and MV
    let mv_rfv = getMV_RFV(transaction)
    pm.treasuryMarketValue = mv_rfv[0]
    pm.treasuryRiskFreeValue = mv_rfv[1]
    pm.treasuryDaiRiskFreeValue = mv_rfv[2]
    pm.treasuryFraxRiskFreeValue = mv_rfv[3]
    pm.treasuryDaiMarketValue = mv_rfv[4]
    pm.treasuryFraxMarketValue = mv_rfv[5]
    pm.treasuryXsushiMarketValue = mv_rfv[6]
    pm.treasuryOhmDaiPOL = mv_rfv[7]
    pm.treasuryOhmFraxPOL = mv_rfv[8]

    // Rebase rewards, APY, rebase
    pm.nextDistributedOhm = getNextOHMRebase(transaction)
    let apy_rebase = getAPY_Rebase(pm.sOhmCirculatingSupply, pm.nextDistributedOhm)
    pm.currentAPY = apy_rebase[0]
    pm.nextEpochRebase = apy_rebase[1]

    //Runway
    let runways = getRunway(pm.sOhmCirculatingSupply, pm.treasuryRiskFreeValue, pm.nextEpochRebase)
    pm.runway10k = runways[0]
    pm.runway20k = runways[1]
    pm.runway50k = runways[2]
    pm.runway70k = runways[3]
    pm.runway100k = runways[4]
    pm.runwayCurrent = runways[5]

    //Holders
    pm.holders = getHolderAux().value
    
    pm.save()
    
}