import { Address } from "@graphprotocol/graph-ts";

//Tokens definition
export const DAIBOND_TOKEN: string = "DAI";
export const OHMDAILPBOND_TOKEN: string = "OHM-DAI";
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

export const DAIBOND_CONTRACTS = '0xa64ed1b66cb2838ef2a198d8345c0ce6967a2a3c';
export const OHMDAISLPBOND_CONTRACT1 = '0x13e8484a86327f5882d1340ed0d7643a29548536';
export const OHMDAISLPBOND_CONTRACT2 = '0xd27001d1aAEd5f002C722Ad729de88a91239fF29';

export function getBondContracts(): string[]{
    return [DAIBOND_CONTRACTS, OHMDAISLPBOND_CONTRACT1, OHMDAISLPBOND_CONTRACT2];
}