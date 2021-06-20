import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

//Tokens definition
export const DAIBOND_TOKEN: string = "DAI";
export const OHMDAILPBOND_TOKEN: string = "OHM-DAI";
export const OHMFRAXLPBOND_TOKEN: string = "OHM-FRAX";

export function getTokenAdress(name: string): Address{
    let address: Address = null
    if (name == DAIBOND_TOKEN)
        address = Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f")
    else if (name == OHMDAILPBOND_TOKEN)
        address = Address.fromString("0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac")
    return address as Address
}
export const SUSHI_OHMDAI_PAIR = '0x34d7d7Aaf50AD4944B70B320aCB24C95fa2def7c';
export const TREASURY_ADDRESS = '0x886CE997aa9ee4F8c2282E182aB72A705762399D';


export const OHMDAISLPBOND_CONTRACT1 = '0xd27001d1aaed5f002c722ad729de88a91239ff29';
export const OHMDAISLPBOND_CONTRACT1_BLOCK = "12154429";
export const OHMDAISLPBOND_CONTRACT2 = '0x13e8484a86327f5882d1340ed0d7643a29548536';
export const OHMDAISLPBOND_CONTRACT2_BLOCK = "12368362";
export const OHMDAISLPBOND_CONTRACT3 = '0x996668c46fc0b764afda88d83eb58afc933a1626';
export const OHMDAISLPBOND_CONTRACT3_BLOCK = "12525388";
export const DAIBOND_CONTRACTS1 = '0xa64ed1b66cb2838ef2a198d8345c0ce6967a2a3c';
export const DAIBOND_CONTRACTS1_BLOCK = "12280908";
export const DAIBOND_CONTRACTS2 = '0xd03056323b7a63e2095ae97fa1ad92e4820ff045';
export const DAIBOND_CONTRACTS2_BLOCK = "12525351";
export const OHMFRAXLPBOND_CONTRACT1 = '0x539b6c906244ac34e348bbe77885cdfa994a3776';
export const OHMFRAXLPBOND_CONTRACT1_BLOCK = "12621882";

export function getBondContracts(): string[]{
    return [DAIBOND_CONTRACTS1, DAIBOND_CONTRACTS2, OHMDAISLPBOND_CONTRACT1, OHMDAISLPBOND_CONTRACT2, OHMFRAXLPBOND_CONTRACT1];
}

export const DISTRIBUTOR_CONTRACT = '0xbe731507810c8747c3e01e62c676b1ca6f93242f';
export const DAO_ADDRESS = '0x245cc372c84b3645bf0ffe6538620b04a217988b';
export const STAKING_CONTRACT = '0x0822f3c03dcc24d200aff33493dc08d0e1f274a2';

export const OHM_ERC20_CONTRACT = '0x383518188c0c6d7730d91b2c03a03c837814a899';
export const SOHM_ERC20_CONTRACT = '0x31932e6e45012476ba3a3a4953cba62aee77fbbe';
export const SOHM_ERC20_CONTRACTV2 = '0x04f2694c8fcee23e8fd0dfea1d4f5bb8c352111f';
export const SOHM_ERC20_CONTRACTV2_BLOCK = '12622596';