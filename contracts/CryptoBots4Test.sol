pragma solidity ^0.5.0;

import "./CryptoBots.sol";

/**
 * Extends CryptoBots contract with helper functions used for testing.
 * For any suggestions please contact me at andrei.dimitrief.jianu(at)gmail.com
 */
contract CryptoBots4Test is CryptoBots
{
    function createCryptoBot4Test(
        string calldata identifier, 
        uint256 level, 
        uint256 intelligence,
        uint256 perception,
        uint256 strength,
        uint256 aggressiveness,
        uint256 armour,
        uint256 agility)
    external
    {
        _createCryptoBot(identifier, level, intelligence, perception, strength, aggressiveness, armour, agility);
    }

    function getClaimedFreeCryptoBot4Test(address cryptoBotOwner)
    external
    view
    returns (bool)
    {
        return _claimedFreeCryptoBot[cryptoBotOwner];
    }

    function getOwnedCryptoBots4Test(address cryptoBotOwner)
    external
    view
    returns (uint256[] memory)
    {
        return _ownedCryptoBots[cryptoBotOwner];
    }

    function getOwnedCryptoBotIndex4Test(uint256 cryptoBotID)
    external
    view
    returns (uint256)
    {
        return _ownedCryptoBotIndex[cryptoBotID];
    }

    function getOwnedCryptoBotID4Test(address cryptoBotOwner, uint256 cryptoBotIndex)
    external
    view
    returns (uint256)
    {
        return _ownedCryptoBots[cryptoBotOwner][cryptoBotIndex];
    }

    function getOwnedCryptoBot4Test(uint256 cryptoBotID)
    external
    view
    returns (
        string memory identifier,
        uint256 level,
        uint256 intelligence,
        uint256 perception,
        uint256 strength,
        uint256 aggressiveness,
        uint256 armour,
        uint256 agility,
        uint256 winCount,
        uint256 lossCount,
        address owner,
        uint256 ID)
    {
        CryptoBot storage cryptoBot = _cryptoBots[cryptoBotID];

        identifier = cryptoBot.identifier;
        level = cryptoBot.level;
        intelligence = cryptoBot.intelligence;
        perception = cryptoBot.perception;
        strength = cryptoBot.strength;
        aggressiveness = cryptoBot.aggressiveness;
        armour = cryptoBot.armour;
        agility = cryptoBot.agility;
        winCount = cryptoBot.winCount;
        lossCount = cryptoBot.lossCount;

        owner = ownerOf(cryptoBotID);
        ID = cryptoBotID;
    }

}
