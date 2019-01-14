pragma solidity ^0.5.0;

/**
 * Based on Blockgeeks course template (cohort November 2018).
 * For any suggestions please contact me at andrei.dimitrief.jianu(at)gmail.com.
 */

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract CryptoBots is ERC721, Ownable, Pausable 
{
    using SafeMath for uint256;

    /////////////////////////////////////////////
    // private members

    struct CryptoBot
    {
        string identifier;
        uint256 level;
        uint256 intelligence;
        uint256 perception;
        uint256 strength;
        uint256 aggressiveness;
        uint256 armour;
        uint256 agility;
        uint256 winCount;
        uint256 lossCount;
    }

    uint256 internal _nonce;

    uint256 internal _fuzzWidth = 10;
    uint256 internal _weightIntelligence = 20;
    uint256 internal _weightPerception = 15;
    uint256 internal _weightStrength = 15;
    uint256 internal _weightAggressiveness = 20;
    uint256 internal _weightArmour = 12;
    uint256 internal _weightAgility = 18;

    CryptoBot[] internal _cryptoBots;

    mapping(address => bool) internal _claimedFreeCryptoBot;

    mapping(address => uint256[]) internal _ownedCryptoBots;
    mapping(uint256 => uint256) internal _ownedCryptoBotIndex;

    uint256 internal _cryptoBotFee = 0.10 ether;

    uint256 internal _cryptoBotIdentifierUpdatableAtLevel = 2;
    uint256 internal _cryptoBotAwardedAtLevel = 10;

    /////////////////////////////////////////////
    // events

    event CryptoBotFeeUpdated(uint256 cryptoBotFee);
    event CryptoBotUpdatableAtLevelUpdated(uint256 level);
    event CryptoBotAwardedAtLevelUpdated(uint256 level);
    event FreeCryptoBotClaimed(address indexed cryptoBotOwner, uint256 indexed cryptoBotID);
    event CryptoBotAcquired(address indexed cryptoBotOwner, uint256 indexed cryptoBotID);
    event CryptoBotIdentifierUpdated(uint256 indexed cryptoBotID);
    event CryptoBotAwarded(address indexed cryptoBotOwner, uint256 indexed cryptoBotID);
    event CryptoBotChallenged(uint256 indexed cryptoBotID, uint256 indexed challengedCryptoBotID, uint256 indexed winnerID);
    event CryptoBotReplicated(uint256 indexed cryptoBotAID, uint256 indexed cryptoBotBID, uint256 indexed cryptoBotID);
    event CryptoBotTransferred(uint256 indexed cryptoBotID, address indexed oldCryptoBotOwner, address indexed newCryptoBotOwner);

    /////////////////////////////////////////////
    // modifiers

    modifier onlyOwnerOfCryptoBot(uint256 cryptoBotID)
    {
        require(msg.sender == ownerOf(cryptoBotID), "not a cryptobot owner");
        _;
    }

    modifier onlyCryptoBotWithLevel(uint256 cryptoBotID, uint256 level)
    {
        require(_cryptoBots[cryptoBotID].level >= level, "cryptobot level too low");
        _;
    }

    modifier onlyValidCryptoBot(uint256 cryptoBotID)
    {
        require(_cryptoBotExists(cryptoBotID), "invalid cryptobot ID");
        _;
    }

    /////////////////////////////////////////////
    // ctors

    constructor()
    public
    {
        // create dummy cryptobot for ID 0;
        _cryptoBots.push(CryptoBot("", 0, 0, 0, 0, 0, 0, 0, 0, 0));

    }

    /////////////////////////////////////////////
    // public functions

    function claimFreeCryptoBot()
    external
    whenNotPaused
    {
        require(!_claimedFreeCryptoBot[msg.sender], "free cryptobot already claimed");

        _claimedFreeCryptoBot[msg.sender] = true;

        uint256 cryptoBotID = _createCryptoBotWithRandomFeatures();

        string memory identifier = _concatenateStrings("CBT-F-", _uint256ToString(cryptoBotID));
        _updateCryptoBotIdentifier(cryptoBotID, identifier);

        emit FreeCryptoBotClaimed(msg.sender, cryptoBotID);
    }

    function buyCryptoBot()
    external
    payable
    whenNotPaused
    {
        require(_cryptoBotFee == msg.value, "only exact change please!");

        uint256 cryptoBotID = _createCryptoBotWithRandomFeatures();

        string memory identifier = _concatenateStrings("CBT-N-", _uint256ToString(cryptoBotID));
        _updateCryptoBotIdentifier(cryptoBotID, identifier);

        emit CryptoBotAcquired(msg.sender, cryptoBotID);
    }

    function replicateCryptoBot(uint256 cryptoBotAID, uint256 cryptoBotBID)
    external
    whenNotPaused
    onlyOwnerOfCryptoBot(cryptoBotAID)
    onlyOwnerOfCryptoBot(cryptoBotBID)
    {
        require(cryptoBotAID != cryptoBotBID, "self replicating is frowned upon");

        uint256 cryptoBotID = _createCryptoBot(
            "", 
            0, 
            _randomLevel(_cryptoBots[cryptoBotAID].intelligence, _cryptoBots[cryptoBotBID].intelligence),
            _randomLevel(_cryptoBots[cryptoBotAID].perception, _cryptoBots[cryptoBotBID].perception),
            _randomLevel(_cryptoBots[cryptoBotAID].strength, _cryptoBots[cryptoBotBID].strength),
            _randomLevel(_cryptoBots[cryptoBotAID].aggressiveness, _cryptoBots[cryptoBotBID].aggressiveness),
            _randomLevel(_cryptoBots[cryptoBotAID].armour, _cryptoBots[cryptoBotBID].armour),
            _randomLevel(_cryptoBots[cryptoBotAID].agility, _cryptoBots[cryptoBotBID].agility));

        string memory identifier = _concatenateStrings("CBT-R-", _uint256ToString(cryptoBotID));
        _updateCryptoBotIdentifier(cryptoBotID, identifier);

        emit CryptoBotReplicated(cryptoBotAID, cryptoBotBID, cryptoBotID);
    }

    function updateCryptoBotIdentifier(uint256 cryptoBotID, string calldata identifier)
    external
    whenNotPaused
    onlyValidCryptoBot(cryptoBotID)
    onlyOwnerOfCryptoBot(cryptoBotID)
    onlyCryptoBotWithLevel(cryptoBotID, _cryptoBotIdentifierUpdatableAtLevel)
    {
        _updateCryptoBotIdentifier(cryptoBotID, identifier);

        emit CryptoBotIdentifierUpdated(cryptoBotID);
    }

    function challengeCryptoBot(uint256 cryptoBotID, uint256 challengedCryptoBotID)
    external
    whenNotPaused
    onlyValidCryptoBot(cryptoBotID)
    onlyValidCryptoBot(challengedCryptoBotID)
    onlyOwnerOfCryptoBot(cryptoBotID)
    {
        uint256 winnerID = _decideChallengeResult(cryptoBotID, challengedCryptoBotID);

        if (winnerID == cryptoBotID)
        {
            _cryptoBots[cryptoBotID].level = _cryptoBots[cryptoBotID].level.add(1);

            _cryptoBots[cryptoBotID].winCount = _cryptoBots[cryptoBotID].winCount.add(1);
            _cryptoBots[challengedCryptoBotID].lossCount = _cryptoBots[challengedCryptoBotID].lossCount.add(1);

            if (_cryptoBotAwardedAtLevel == _cryptoBots[cryptoBotID].level)
            {
                uint256 awardedCryptoBotID = _createCryptoBotWithRandomFeatures();

                string memory identifier = _concatenateStrings("CBT-A-", _uint256ToString(awardedCryptoBotID));
                _updateCryptoBotIdentifier(awardedCryptoBotID, identifier);

                emit CryptoBotAwarded(msg.sender, awardedCryptoBotID);
            }
        }
        else
        {
            _cryptoBots[cryptoBotID].lossCount = _cryptoBots[cryptoBotID].lossCount.add(1);
            _cryptoBots[challengedCryptoBotID].winCount = _cryptoBots[challengedCryptoBotID].winCount.add(1);
        }

        emit CryptoBotChallenged(cryptoBotID, challengedCryptoBotID, winnerID);
    }

    function withdrawFunds(address payable withdrawalAddress, uint256 withdrawalAmount)
    external 
    onlyOwner
    {
        require(address(0) != withdrawalAddress, "invalid withdrawal address");
        require(address(this).balance > withdrawalAmount, "insuficient funds");

        withdrawalAddress.transfer(withdrawalAmount);
    }

    /////////////////////////////////////////////
    // setters

    function setCryptoBotFee(uint256 cryptoBotFee)
    external
    onlyOwner
    {
        _cryptoBotFee = cryptoBotFee;

        emit CryptoBotFeeUpdated(cryptoBotFee);
    }

    function setCryptoBotIdentifierUpdatableAtLevel(uint256 level)
    external
    onlyOwner
    {
        _cryptoBotIdentifierUpdatableAtLevel = level;

        emit CryptoBotUpdatableAtLevelUpdated(level);
    }

    function setCryptoBotAwardedAtLevel(uint256 level)
    external
    onlyOwner
    {
        _cryptoBotAwardedAtLevel = level;

        emit CryptoBotAwardedAtLevelUpdated(level);
    }

    /////////////////////////////////////////////
    // getters

    function getCryptoBotFee()
    external
    view
    returns(uint256)
    {
        return _cryptoBotFee;
    }

    function getCryptoBotIdentifierUpdatableAtLevel()
    external
    view
    returns(uint256)
    {
        return _cryptoBotIdentifierUpdatableAtLevel;
    }

    function getCryptoBotAwardedAtLevel()
    external
    view
    returns(uint256)
    {
        return _cryptoBotAwardedAtLevel;
    }

    function getCryptoBotsOwnedBy(address cryptoBotOwner)
    external
    view
    returns(uint256[] memory)
    {
        require(address(0) != cryptoBotOwner, "invalid cryptobot owner address");

        return _ownedCryptoBots[cryptoBotOwner];
    }

    /////////////////////////////////////////////
    // overrides

    function transferFrom(
        address fromCryptoBotOwner,
        address toCryptoBotOwner,
        uint256 cryptoBotID)
    public
    onlyValidCryptoBot(cryptoBotID)
    {
        super.transferFrom(fromCryptoBotOwner, toCryptoBotOwner, cryptoBotID);

        _removeOwnedCryptoBot(fromCryptoBotOwner, cryptoBotID);
        _addOwnedCryptoBot(toCryptoBotOwner, cryptoBotID);

        emit CryptoBotTransferred(cryptoBotID, fromCryptoBotOwner, toCryptoBotOwner);
    }

    function safeTransferFrom(
        address fromCryptoBotOwner,
        address toCryptoBotOwner,
        uint256 cryptoBotID)
    public
    onlyValidCryptoBot(cryptoBotID)
    {
        super.safeTransferFrom(fromCryptoBotOwner, toCryptoBotOwner, cryptoBotID);

        _removeOwnedCryptoBot(fromCryptoBotOwner, cryptoBotID);
        _addOwnedCryptoBot(toCryptoBotOwner, cryptoBotID);

        emit CryptoBotTransferred(cryptoBotID, fromCryptoBotOwner, toCryptoBotOwner);
    }

    function safeTransferFrom(
        address fromCryptoBotOwner,
        address toCryptoBotOwner,
        uint256 cryptoBotID,
        bytes memory _data)
    public
    onlyValidCryptoBot(cryptoBotID)
    {
        super.safeTransferFrom(fromCryptoBotOwner, toCryptoBotOwner, cryptoBotID, _data);

        _removeOwnedCryptoBot(fromCryptoBotOwner, cryptoBotID);
        _addOwnedCryptoBot(toCryptoBotOwner, cryptoBotID);

        emit CryptoBotTransferred(cryptoBotID, fromCryptoBotOwner, toCryptoBotOwner);
    }

    /////////////////////////////////////////////
    // private functions

    function _cryptoBotExists(uint256 cryptoBotID)
    internal
    view
    returns (bool)
    {
        return (address(0) != ownerOf(cryptoBotID));
    }

    function _updateCryptoBotIdentifier(uint256 cryptoBotID, string memory identifier)
    internal
    {
        _cryptoBots[cryptoBotID].identifier = identifier;
    }

    function _nonceValue()
    internal
    returns (uint256)
    {
        _nonce++;

        return _nonce;
    }

    function _randomUIntBetween(uint256 start, uint256 end) 
    internal 
    returns (uint256) 
    {
        require(start < end, "lower limit needs to be lower");

        // use of nonce, block.timestamp, block.difficulty to generate (quasi)random uint
        return uint256(keccak256(abi.encodePacked(_nonceValue(), block.timestamp, block.difficulty)))%(end - start) + start;
    }

    function _randomLevel(uint256 levelA, uint256 levelB)
    internal
    returns (uint256 randomLevel)
    {
        if (levelA == levelB)
        {
            randomLevel = _generateFuzzyLevel(levelA, _fuzzWidth);
        }
        else if (levelA < levelB)
        {
            randomLevel = (levelA + levelB + _randomUIntBetween(levelA, levelB)) / 3;
        }
        else // levelA > levelB
        {
            randomLevel = (levelA + levelB + _randomUIntBetween(levelB, levelA)) / 3;
        }
    }

    function _randomIntelligenceLevel() 
    internal 
    returns (uint256) 
    {
        // use nonce, (1) msg.sender, (2) block.timestamp, (3) block.difficulty to generate (quasi)random uint
        return uint256(keccak256(abi.encodePacked(_nonceValue(), msg.sender, block.timestamp, block.difficulty)))%100 + 1;
    }

    function _randomPerceptionLevel() 
    internal 
    returns (uint256) 
    {
        // use nonce, (2) block.timestamp, (3) block.difficulty, (1) msg.sender to generate (quasi)random uint
        return uint256(keccak256(abi.encodePacked(_nonceValue(), block.timestamp, block.difficulty, msg.sender)))%100 + 1;
    }

    function _randomStrengthLevel() 
    internal  
    returns (uint256) 
    {
        // use nonce, (3) block.difficulty, (1) msg.sender, (2) block.timestamp to generate (quasi)random uint
        return uint256(keccak256(abi.encodePacked(_nonceValue(), block.difficulty, msg.sender, block.timestamp)))%100 + 1;
    }

    function _randomAggressivenessLevel() 
    internal 
    returns (uint256) 
    {
        // use nonce, (1) msg.sender, (3) block.difficulty, (2) block.timestamp to generate (quasi)random uint
        return uint256(keccak256(abi.encodePacked(_nonceValue(), msg.sender, block.difficulty, block.timestamp)))%100 + 1;
    }

    function _randomArmourLevel() 
    internal  
    returns (uint256) 
    {
        // use nonce, (3) block.difficulty, (2) block.timestamp, (1) msg.sender to generate (quasi)random uint
        return uint256(keccak256(abi.encodePacked(_nonceValue(), block.difficulty, block.timestamp, msg.sender)))%100 + 1;
    }

    function _randomAgilityLevel() 
    internal 
    returns (uint256) 
    {
        // use nonce, (2) block.timestamp, (1) msg.sender, (3) block.difficulty to generate (quasi)random uint
        return uint256(keccak256(abi.encodePacked(_nonceValue(), block.timestamp, msg.sender, block.difficulty)))%100 + 1;
    }

    function _createCryptoBotWithRandomFeatures()
    internal
    returns(uint256)
    {
        uint256 cryptoBotID = _createCryptoBot(
            "", 
            0, 
            _randomIntelligenceLevel(),
            _randomPerceptionLevel(),
            _randomStrengthLevel(),
            _randomAggressivenessLevel(),
            _randomArmourLevel(),
            _randomAgilityLevel());

        return cryptoBotID;
    }

    function _createCryptoBot(
        string memory identifier, 
        uint256 level, 
        uint256 intelligence,
        uint256 perception,
        uint256 strength,
        uint256 aggressiveness,
        uint256 armour,
        uint256 agility)
    internal
    returns(uint256)
    {
        address cryptoBotOwner = msg.sender;
        uint256 cryptoBotID = _cryptoBots.length;

        _cryptoBots.push(CryptoBot(
            identifier, 
            level, 
            intelligence, 
            perception, 
            strength, 
            aggressiveness, 
            armour, 
            agility, 
            0, 
            0));

        _mint(cryptoBotOwner, cryptoBotID);
        _addOwnedCryptoBot(cryptoBotOwner, cryptoBotID);
        
        return cryptoBotID;
    }

    function _decideChallengeResult(uint256 cryptoBotID, uint256 challengedCryptoBotID)
    internal
    returns(uint256 winnerID)
    {
        winnerID = cryptoBotID;

        uint256 cryptoBotEnergyLevel = _retrieveEnergyLevel(cryptoBotID);
        uint256 challengedEnergyLevel = _retrieveEnergyLevel(challengedCryptoBotID);

        if (cryptoBotEnergyLevel <= challengedEnergyLevel)
        {
            winnerID = challengedCryptoBotID;
        }
    }

    function _retrieveEnergyLevel(uint256 cryptoBotID)
    internal
    returns(uint256 energyLevel)
    {
        CryptoBot storage cryptoBot = _cryptoBots[cryptoBotID];

        energyLevel = _weightIntelligence * _generateFuzzyLevel(cryptoBot.intelligence, _fuzzWidth);
        energyLevel += _weightPerception * _generateFuzzyLevel(cryptoBot.perception, _fuzzWidth);
        energyLevel += _weightStrength * _generateFuzzyLevel(cryptoBot.strength, _fuzzWidth);
        energyLevel += _weightAggressiveness * _generateFuzzyLevel(cryptoBot.aggressiveness, _fuzzWidth);
        energyLevel += _weightArmour * _generateFuzzyLevel(cryptoBot.armour, _fuzzWidth);
        energyLevel += _weightAgility * _generateFuzzyLevel(cryptoBot.agility, _fuzzWidth);

        energyLevel /= 100;
    }

    function _generateFuzzyLevel(uint256 level, uint256 fuzzWidth)
    internal
    returns(uint256)
    {
        uint256 levelMin = 1;
        if (level - fuzzWidth > 0)
        {
            levelMin = level - fuzzWidth;
        }

        uint256 levelMax = 100;
        if (level + fuzzWidth < 100)
        {
            levelMax = level + fuzzWidth;
        }

        return _randomLevel(levelMin, levelMax);
    }

    function _addOwnedCryptoBot(address cryptoBotOwner, uint256 cryptoBotID)
    internal
    {
        uint256 cryptoBotIndex = _ownedCryptoBots[cryptoBotOwner].length;

        _ownedCryptoBots[cryptoBotOwner].push(cryptoBotID);
        _ownedCryptoBotIndex[cryptoBotID] = cryptoBotIndex;
    }

    function _removeOwnedCryptoBot(address cryptoBotOwner, uint256 cryptoBotID)
    internal
    {
        uint256 cryptoBotIndex = _ownedCryptoBotIndex[cryptoBotID];
        uint256 lastCryptoBotIndex = _ownedCryptoBots[cryptoBotOwner].length.sub(1);
        uint256 lastCryptoBotID = _ownedCryptoBots[cryptoBotOwner][lastCryptoBotIndex];

        _ownedCryptoBots[cryptoBotOwner][cryptoBotIndex] = lastCryptoBotID;
        _ownedCryptoBots[cryptoBotOwner][lastCryptoBotIndex] = 0;
        _ownedCryptoBots[cryptoBotOwner].length--;

        _ownedCryptoBotIndex[cryptoBotID] = 0;
        _ownedCryptoBotIndex[lastCryptoBotID] = cryptoBotIndex;
    }

    /////////////////////////////////////////////
    // conversions
    
    function _byteToChar(byte byteData)
    internal
    pure
    returns(byte char)
    {
        char = byte(uint8(byteData) + 0x57);
        if(uint8(byteData) < 10) 
        {
            char = byte(uint8(byteData) + 0x30);
        }
    }

    function _uint256ToString(uint256 uint256data) 
    internal
    pure
    returns (string memory) 
    {
        bytes32 bytes32data = bytes32(uint256data);
        
        bytes memory bytesString = new bytes(64);
        uint256 charCount = 0;
        bool paddingZero = true;
        for (uint256 j = 0; j < 32; j++) 
        {
            byte char = byte(bytes32(uint256(bytes32data) * 2 ** (8 * j)));
            if (char != 0 || !paddingZero) 
            {
                paddingZero = false;
                
                byte charHi = byte(uint8(char) / 16);
                byte charLo = byte(uint8(char) - 16 * uint8(charHi));

                charHi = _byteToChar(charHi);
                charLo = _byteToChar(charLo);

                bytesString[charCount] = charHi;
                bytesString[charCount + 1] = charLo;
                
                charCount += 2;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (uint256 j = 0; j < charCount; j++) 
        {
            bytesStringTrimmed[j] = bytesString[j];
        }
        return string(bytesStringTrimmed);
    }

    function _concatenateStrings(string memory stringA, string memory stringB)
    internal
    pure
    returns(string memory)
    {
        bytes memory bytesA = bytes(stringA);
        bytes memory bytesB = bytes(stringB);
        bytes memory bytesResult = new bytes(bytesA.length + bytesB.length);
        
        uint256 k = 0;
        for (uint256 i = 0; i < bytesA.length; i++) bytesResult[k++] = bytesA[i];
        for (uint256 i = 0; i < bytesB.length; i++) bytesResult[k++] = bytesB[i];

        return string(bytesResult);
    }
}