
var { expectThrow, expectEvent } = require('./utils.js');

var CryptoBots4Test = artifacts.require('CryptoBots4Test');

function displayCryptoBot(cryptoBot)
{
    let identifier = cryptoBot[0];
    let level = cryptoBot[1];
    let intelligence = cryptoBot[2];
    let perception = cryptoBot[3];
    let strength = cryptoBot[4];
    let aggressiveness = cryptoBot[5];
    let armour = cryptoBot[6];
    let agility = cryptoBot[7];
    let winCount = cryptoBot[8];
    let lossCount = cryptoBot[9];

    let owner = cryptoBot[10];
    let cryptoBotID = cryptoBot[11];

    console.log('------- crypto-bot:    ' + identifier);
    console.log('\tlevel          ' + level);
    console.log('\tintelligence   ' + intelligence);
    console.log('\tperception     ' + perception);
    console.log('\tstrength       ' + strength);
    console.log('\taggressiveness ' + aggressiveness);
    console.log('\tarmour         ' + armour);
    console.log('\tagility        ' + agility);
    console.log('\twin count      ' + winCount);
    console.log('\tloss count     ' + lossCount);

    console.log('\n\towner: ' + owner);
    console.log('\tID:      ' + cryptoBotID);
}

contract('CryptoBots contract tests\n', async (accounts) => 
{
    let ether = 1e+18;

    let zero = 0x0000000000000000000000000000000000000000;
    let owner = accounts[0];

    let player1 = accounts[1];
    let player2 = accounts[2];
    let player3 = accounts[3];
    let player4 = accounts[4];
    let player5 = accounts[5];

    console.log('------- accounts:');
    console.log('\tcontract owner: ' + owner);
    console.log('\tplayer #1:      ' + player1);
    console.log('\tplayer #2:      ' + player2);
    console.log('\tplayer #3:      ' + player3);
    console.log('\tplayer #4:      ' + player4);
    console.log('\tplayer #5:      ' + player5);
    
    let contract;
    
    beforeEach(async () => 
    {
        contract = await CryptoBots4Test.new();
    });

    describe('constructor() test', () => 
    {
        it('should conform to ERC721 via ERC165', async () => 
        {
            let result = await contract.supportsInterface("0x80ac58cd");

            assert.isTrue(result, "contract should conform to ERC721 via ERC165");
        });

        it('should set the owner of the contract the message sender', async () => 
        {
            let result = await contract.owner();

            assert.isTrue(result == owner, "should set the owner of the contract the message sender");
        });
    });

    describe('claimFreeCryptoBot() test', () => 
    {
        it('should return one free cryptobot', async () => 
        {
            await contract.claimFreeCryptoBot({ from: player1 });
            await contract.claimFreeCryptoBot({ from: player2 });

            let player1cryptobots = await contract.getOwnedCryptoBots4Test(player1);
            let player2cryptobots = await contract.getOwnedCryptoBots4Test(player2);
            let player3cryptobots = await contract.getOwnedCryptoBots4Test(player3);

            //let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            //let cryptoBot = await contract.getOwnedCryptoBot4Test(cryptoBotID);
            //displayCryptoBot(cryptoBot);

            assert.equal(1 , player1cryptobots.length, "player #1 should have one free cryptobot");
            assert.equal(1 , player2cryptobots.length, "player #2 should have one free cryptobot");
            assert.equal(0 , player3cryptobots.length, "player #3 should have no cryptobots");
        });
        
        it('should not claim more than one free cryptobot', async () => 
        {
            await contract.claimFreeCryptoBot({ from: player2 });

            let tx = contract.claimFreeCryptoBot({ from: player2 });
            await expectThrow(tx, "player #2 should not be able to claim one more free cryptobot");
        });

        it('should emit FreeCryptoBotClaimed event', async () => 
        {
            let tx = contract.claimFreeCryptoBot({ from: player3 });

            expectEvent(tx, 'FreeCryptoBotClaimed', "contract does not emit event");
        });

        it('should not claim free cryptobot when paused', async () => 
        {
            await contract.pause({ from: owner });

            let tx = contract.claimFreeCryptoBot({ from: player2 });
            await expectThrow(tx, "player #2 claimed free cryptobot when paused");
        });
    });

    describe('buyCryptoBot() test', () => 
    {
        it('should not allow player to buy a cryptobot with incorrect fee', async () => 
        {
            let tx = contract.buyCryptoBot({ from: player3, value: 2e+17 });
            await expectThrow(tx, "player #3 bought cryptobot with an incorrect fee");
        });

        it('should allow player to buy a cryptobot with the correct fee', async () => 
        {
            await contract.buyCryptoBot({ from: player4, value: 1e+17 });
            let player4cryptobots = await contract.getOwnedCryptoBots4Test(player4);

            await contract.buyCryptoBot({ from: player5, value: 1e+17 });
            await contract.buyCryptoBot({ from: player5, value: 1e+17 });
            let player5cryptobots = await contract.getOwnedCryptoBots4Test(player5);

            assert.equal(1, player4cryptobots.length, "player #4 should have 1 cryptobot");
            assert.equal(2, player5cryptobots.length, "player #5 should have 2 cryptobots");
        });

        it('should emit CryptoBotAcquired event', async () => 
        {
            let tx = contract.buyCryptoBot({ from: player3, value: 1e+17 });

            expectEvent(tx, 'CryptoBotAcquired', "contract does not emit event");
        });

        it('should not buy cryptobot when paused', async () => 
        {
            await contract.pause({ from: owner });

            let tx = contract.buyCryptoBot({ from: player2, value: 1e+17 });
            await expectThrow(tx, "player #2 bought cryptobot when paused");
        });
    });

    describe('replicateCryptoBot() test', () => 
    {
        it('should not allow replication when cryptobot not owned by player', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            await contract.buyCryptoBot({ from: player2, value: 1e+17 });

            let cryptoBotAid = await contract.getOwnedCryptoBotID4Test(player1, 0);
            let cryptoBotBid = await contract.getOwnedCryptoBotID4Test(player2, 0);

            //let cryptoBotA = await contract.getOwnedCryptoBot4Test(cryptoBotAid);
            //let cryptoBotB = await contract.getOwnedCryptoBot4Test(cryptoBotBid);
            //displayCryptoBot(cryptoBotA);
            //displayCryptoBot(cryptoBotB);

            let tx = contract.replicateCryptoBot(cryptoBotAid, cryptoBotBid, { from: player1 });
            await expectThrow(tx, "player #1 can replicate cryptoBot of player #2");
        });
        
        it('should not allow replication when cryptobot not owned by player', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            await contract.buyCryptoBot({ from: player2, value: 1e+17 });

            let cryptoBotAid = await contract.getOwnedCryptoBotID4Test(player1, 0);
            let cryptoBotBid = await contract.getOwnedCryptoBotID4Test(player2, 0);

            //let cryptoBotA = await contract.getOwnedCryptoBot4Test(cryptoBotAid);
            //let cryptoBotB = await contract.getOwnedCryptoBot4Test(cryptoBotBid);
            //displayCryptoBot(cryptoBotA);
            //displayCryptoBot(cryptoBotB);

            let tx = contract.replicateCryptoBot(cryptoBotAid, cryptoBotBid, { from: player2 });
            await expectThrow(tx, "player #1 can replicate cryptoBot of player #2");
        });
        
        it('should not allow player to replicate same cryptobot', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);

            let tx = contract.replicateCryptoBot(cryptoBotID, cryptoBotID, { from: player1 });
            await expectThrow(tx, "player #1 can replicate same cryptoBot");
        });
        
        it('should allow player to replicate existing cryptobots', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            
            let cryptoBotAid = await contract.getOwnedCryptoBotID4Test(player1, 0);
            let cryptoBotBid = await contract.getOwnedCryptoBotID4Test(player1, 1);

            await contract.replicateCryptoBot(cryptoBotAid, cryptoBotBid, { from: player1 });
            
            let cryptoBotCid = await contract.getOwnedCryptoBotID4Test(player1, 2);

            //let cryptoBotA = await contract.getOwnedCryptoBot4Test(cryptoBotAid);
            //let cryptoBotB = await contract.getOwnedCryptoBot4Test(cryptoBotBid);
            //let cryptoBotC = await contract.getOwnedCryptoBot4Test(cryptoBotCid);
            //displayCryptoBot(cryptoBotA);
            //displayCryptoBot(cryptoBotB);
            //displayCryptoBot(cryptoBotC);

            let player1cryptobots = await contract.getOwnedCryptoBots4Test(player1);

            assert.equal(3, player1cryptobots.length, "player #1 should have 3 cryptobots");
        });
        
        it('should emit CryptoBotReplicated event', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            
            let cryptoBotAid = await contract.getOwnedCryptoBotID4Test(player1, 0);
            let cryptoBotBid = await contract.getOwnedCryptoBotID4Test(player1, 1);

            let tx = contract.replicateCryptoBot(cryptoBotAid, cryptoBotBid, { from: player1 });

            expectEvent(tx, 'CryptoBotReplicated', "contract does not emit event");
        });

        it('should allow player to replicate existing cryptobots when paused', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            
            let cryptoBotAid = await contract.getOwnedCryptoBotID4Test(player1, 0);
            let cryptoBotBid = await contract.getOwnedCryptoBotID4Test(player1, 1);

            await contract.pause({ from: owner });

            let tx = contract.replicateCryptoBot(cryptoBotAid, cryptoBotBid, { from: player1 });
            await expectThrow(tx, "player #1 can replicate cryptoBots when contract paused");
        });
    });

    describe('updateCryptoBotIdentifier() test', () => 
    {
        it('should not update identifier for invalid cryptobot ID', async () => 
        {
            let tx = contract.updateCryptoBotIdentifier(2000, "wqewqewqewewqeq", { from: player1 });
            await expectThrow(tx, "player can update identifier for invalid cryptobot ID");
        });

        it('should not update identifier if sender not owner of cryptobot', async () => 
        {
            await contract.createCryptoBot4Test("weweqwe", 4, 10, 10, 10, 10, 10, 10, { from: player1 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);

            let tx = contract.updateCryptoBotIdentifier(cryptoBotID, "wqewqewqewewqeq", { from: player2 });
            await expectThrow(tx, "player can update identifier if not owner of cryptobot");
        });

        it('should not update identifier if cryptobot not at required level', async () => 
        {
            await contract.createCryptoBot4Test("weweqwe", 1, 10, 10, 10, 10, 10, 10, { from: player1 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);

            let tx = contract.updateCryptoBotIdentifier(cryptoBotID, "wqewqewqewewqeq", { from: player1 });
            await expectThrow(tx, "player can update identifier if cryptobot not at required level");
        });

        it('should update identifier for valid cryptobot ', async () => 
        {
            await contract.createCryptoBot4Test("old-identifier", 2, 10, 10, 10, 10, 10, 10, { from: player1 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            
            await contract.updateCryptoBotIdentifier(cryptoBotID, "new-identifier", { from: player1 });

            let cryptoBot = await contract.getOwnedCryptoBot4Test(cryptoBotID);
            let identifier = cryptoBot[0];

            assert.equal(identifier, "new-identifier", "player cannot update identifier for valid cryptobot");
        });

        it('should emit CryptoBotIdentifierUpdated event', async () => 
        {
            await contract.createCryptoBot4Test("old-identifier", 2, 10, 10, 10, 10, 10, 10, { from: player1 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            
            let tx = contract.updateCryptoBotIdentifier(cryptoBotID, "new-identifier", { from: player1 });

            expectEvent(tx, 'CryptoBotIdentifierUpdated', "contract does not emit event");
        });

        it('should not allow update identifier for valid cryptobot when paused', async () => 
        {
            await contract.createCryptoBot4Test("old-identifier", 2, 10, 10, 10, 10, 10, 10, { from: player1 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            
            await contract.pause({ from: owner });

            let tx = contract.updateCryptoBotIdentifier(cryptoBotID, "new-identifier", { from: player1 });
            expectThrow(tx, "player updated cryptobot identifier when contract paused");
        });
    });

    describe('challengeCryptoBot() test', () => 
    {
        it('should not allow player to challenge with invalid cryptobot', async () => 
        {
            await contract.createCryptoBot4Test("CTB-N-A", 9, 80, 80, 80, 80, 80, 80, { from: player1 });
            let cryptoBotAID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            await contract.createCryptoBot4Test("CTB-N-B", 4, 30, 30, 30, 30, 30, 30, { from: player2 });
            let cryptoBotBID = await contract.getOwnedCryptoBotID4Test(player2, 0);

            let tx = contract.challengeCryptoBot(1000, cryptoBotBID, { from: player1 });
            expectThrow(tx, "player challenged with invalid cryptobot ID");
        });

        it('should not allow player to challenge an invalid cryptobot', async () => 
        {
            await contract.createCryptoBot4Test("CTB-N-A", 9, 80, 80, 80, 80, 80, 80, { from: player1 });
            let cryptoBotAID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            await contract.createCryptoBot4Test("CTB-N-B", 4, 30, 30, 30, 30, 30, 30, { from: player2 });
            let cryptoBotBID = await contract.getOwnedCryptoBotID4Test(player2, 0);

            let tx = contract.challengeCryptoBot(cryptoBotAID, 1000, { from: player2 });
            expectThrow(tx, "player challenged invalid cryptobot ID");
        });

        it('should not allow player to challenge with cryptobot she does not own', async () => 
        {
            await contract.createCryptoBot4Test("CTB-N-A", 9, 80, 80, 80, 80, 80, 80, { from: player1 });
            let cryptoBotAID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            await contract.createCryptoBot4Test("CTB-N-B", 4, 30, 30, 30, 30, 30, 30, { from: player2 });
            let cryptoBotBID = await contract.getOwnedCryptoBotID4Test(player2, 0);

            let tx = contract.challengeCryptoBot(cryptoBotAID, cryptoBotBID, { from: player3 });
            expectThrow(tx, "player does not own challenging cryptobot");
        });

        it('should have superior cryptobot win the challenge', async () => 
        {
            await contract.createCryptoBot4Test("CTB-N-A", 8, 80, 80, 80, 80, 80, 80, { from: player1 });
            let cryptoBotAID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            await contract.createCryptoBot4Test("CTB-N-B", 4, 30, 30, 30, 30, 30, 30, { from: player2 });
            let cryptoBotBID = await contract.getOwnedCryptoBotID4Test(player2, 0);

            await contract.challengeCryptoBot(cryptoBotAID, cryptoBotBID, { from: player1 });
            
            let cryptoBotA = await contract.getOwnedCryptoBot4Test(cryptoBotAID);
            let cryptoBotAlevel = cryptoBotA[1];
            let cryptoBotAwinCount = cryptoBotA[8];
            
            let cryptoBotB = await contract.getOwnedCryptoBot4Test(cryptoBotBID);
            let cryptoBotBlevel = cryptoBotB[1];
            let cryptoBotBlossCount = cryptoBotB[9];

            assert.equal(9, cryptoBotAlevel, "incorrect level for cryptobot A");
            assert.equal(1, cryptoBotAwinCount, "incorrect win count for cryptobot A");
            assert.equal(4, cryptoBotBlevel, "incorrect level for cryptobot B");
            assert.equal(1, cryptoBotBlossCount, "incorrect loss count for cryptobot B");
        });

        it('should have inferior cryptobot lose the challenge', async () => 
        {
            await contract.createCryptoBot4Test("CTB-N-A", 4, 30, 30, 30, 30, 30, 30, { from: player1 });
            let cryptoBotAID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            await contract.createCryptoBot4Test("CTB-N-B", 8, 80, 80, 80, 80, 80, 80, { from: player2 });
            let cryptoBotBID = await contract.getOwnedCryptoBotID4Test(player2, 0);

            await contract.challengeCryptoBot(cryptoBotAID, cryptoBotBID, { from: player1 });
            
            let cryptoBotA = await contract.getOwnedCryptoBot4Test(cryptoBotAID);
            let cryptoBotAlevel = cryptoBotA[1];
            let cryptoBotAlossCount = cryptoBotA[9];
            
            let cryptoBotB = await contract.getOwnedCryptoBot4Test(cryptoBotBID);
            let cryptoBotBlevel = cryptoBotB[1];
            let cryptoBotBwinCount = cryptoBotB[8];

            assert.equal(4, cryptoBotAlevel, "incorrect level for cryptobot A");
            assert.equal(1, cryptoBotAlossCount, "incorrect loss count for cryptobot A");
            assert.equal(8, cryptoBotBlevel, "incorrect level for cryptobot B");
            assert.equal(1, cryptoBotBwinCount, "incorrect win count for cryptobot B");
        });

        it('should have cryptobot awarded if win the challenge and level above required level', async () => 
        {
            await contract.createCryptoBot4Test("CTB-N-A", 9, 80, 80, 80, 80, 80, 80, { from: player1 });
            let cryptoBotAID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            await contract.createCryptoBot4Test("CTB-N-B", 4, 30, 30, 30, 30, 30, 30, { from: player2 });
            let cryptoBotBID = await contract.getOwnedCryptoBotID4Test(player2, 0);

            await contract.challengeCryptoBot(cryptoBotAID, cryptoBotBID, { from: player1 });
            
            let cryptoBotA = await contract.getOwnedCryptoBot4Test(cryptoBotAID);
            let cryptoBotAlevel = cryptoBotA[1];
            let cryptoBotAwinCount = cryptoBotA[8];
            
            let cryptoBotB = await contract.getOwnedCryptoBot4Test(cryptoBotBID);
            let cryptoBotBlevel = cryptoBotB[1];
            let cryptoBotBlossCount = cryptoBotB[9];

            let cryptoBotCID = await contract.getOwnedCryptoBotID4Test(player1, 1);
            let cryptoBotC = await contract.getOwnedCryptoBot4Test(cryptoBotCID);
            let cryptoBotCidentifier = cryptoBotC[0];

            assert.equal(10, cryptoBotAlevel, "incorrect level for cryptobot A");
            assert.equal(1, cryptoBotAwinCount, "incorrect win count for cryptobot A");
            assert.equal(4, cryptoBotBlevel, "incorrect level for cryptobot B");
            assert.equal(1, cryptoBotBlossCount, "incorrect loss count for cryptobot B");

            assert.isTrue(cryptoBotCidentifier.startsWith("CBT-A-"), "winner not awarded cryptobot");
        });

        it('should emit CryptoBotChallenged event', async () => 
        {
            await contract.createCryptoBot4Test("CTB-N-A", 8, 80, 80, 80, 80, 80, 80, { from: player1 });
            let cryptoBotAID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            await contract.createCryptoBot4Test("CTB-N-B", 4, 30, 30, 30, 30, 30, 30, { from: player2 });
            let cryptoBotBID = await contract.getOwnedCryptoBotID4Test(player2, 0);

            let tx = contract.challengeCryptoBot(cryptoBotAID, cryptoBotBID, { from: player1 });
            expectEvent(tx, 'CryptoBotChallenged', "contract does not emit event");
        });

        it('should emit CryptoBotAwarded event', async () => 
        {
            await contract.createCryptoBot4Test("CTB-N-A", 9, 80, 80, 80, 80, 80, 80, { from: player1 });
            let cryptoBotAID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            await contract.createCryptoBot4Test("CTB-N-B", 4, 30, 30, 30, 30, 30, 30, { from: player2 });
            let cryptoBotBID = await contract.getOwnedCryptoBotID4Test(player2, 0);

            let tx = contract.challengeCryptoBot(cryptoBotAID, cryptoBotBID, { from: player1 });
            expectEvent(tx, 'CryptoBotAwarded', "contract does not emit event");
        });

        it('should not allow player to challenge cryptobot when paused', async () => 
        {
            await contract.createCryptoBot4Test("CTB-N-A", 8, 80, 80, 80, 80, 80, 80, { from: player1 });
            let cryptoBotAID = await contract.getOwnedCryptoBotID4Test(player1, 0);
            await contract.createCryptoBot4Test("CTB-N-B", 4, 30, 30, 30, 30, 30, 30, { from: player2 });
            let cryptoBotBID = await contract.getOwnedCryptoBotID4Test(player2, 0);

            await contract.pause({ from: owner });

            let tx = contract.challengeCryptoBot(cryptoBotAID, cryptoBotBID, { from: player1 });
            expectThrow(tx, "player can challenge cryptobot when contract paused");
        });
    });

    describe('withdrawFunds() test', () => 
    {
        it('it should not allow non-owner to widthdraw funds', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });

            let tx = contract.withdrawFunds(owner, 0.09 * ether, { from: player1 });
            expectThrow(tx, "non-owner can withdraw funds");
        });

        it('it should not allow withdrawal to invalid address', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });

            let tx = contract.withdrawFunds(zero, 0.09 * ether, { from: owner });
            expectThrow(tx, "withdrawal to invalid address allowed");
        });
        
        it('it should fail if funds are not available', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });

            let tx = contract.withdrawFunds(owner, 0.2 * ether, { from: owner });
            expectThrow(tx, "withdrawal when insufficient funds allowed");
        });

        it('it should allow owner to withdraw funds', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });

            let oldBalance = await web3.eth.getBalance(contract.address);
            await contract.withdrawFunds(owner, web3.utils.toBN(0.15 * ether), { from: owner });
            let newBalance = await web3.eth.getBalance(contract.address);

            assert.isTrue(web3.utils.toBN(oldBalance).gt(web3.utils.toBN(newBalance)), "owner unable to withdraw funds");
        });
    });

    describe('transferFrom() test', () => 
    {
        it('it should fail for invalid cryptobot ID', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);

            let tx = contract.transferFrom(player1, player2, 1000, { from: player1 });
            expectThrow(tx, "player can transfer cryptobot with invalid ID");
        });

        it('it should fail for invalid owner address', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);

            let tx = contract.transferFrom(zero, player2, cryptoBotID, { from: player1 });
            expectThrow(tx, "cryptobot transfer from invalid address allowed");
        });

        it('it should fail for invalid new owner address', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);

            let tx = contract.transferFrom(player1, zero, cryptoBotID, { from: player1 });
            expectThrow(tx, "cryptobot transfer to invalid address allowed");
        });

        it('it should fail if the cryptobot does not belong to seller', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);

            let tx = contract.transferFrom(player1, player2, cryptoBotID, { from: player3 });
            expectThrow(tx, "cryptobot does not belong to seller");
        });

        it('it should allow transfer for valid cryptobot from player', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);

            await contract.transferFrom(player1, player2, cryptoBotID, { from: player1 });
            
            let newOwner = await contract.ownerOf(cryptoBotID);

            assert.notEqual(player1, newOwner, "player #1 is still the cryptobot owner");
            assert.equal(player2, newOwner, "player #2 is not the new cryptobot owner");
        });

        it('it should allow transfer for valid cryptobot from approved player', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);

            await contract.approve(player3, cryptoBotID, { from: player1 });

            await contract.transferFrom(player1, player2, cryptoBotID, { from: player3 });
            
            let newOwner = await contract.ownerOf(cryptoBotID);

            assert.notEqual(player1, newOwner, "player #1 is still the cryptobot owner");
            assert.equal(player2, newOwner, "player #2 is not the new cryptobot owner");
        });

        it('it should emit CryptoBotTransferred event', async () => 
        {
            await contract.buyCryptoBot({ from: player1, value: 1e+17 });
            let cryptoBotID = await contract.getOwnedCryptoBotID4Test(player1, 0);

            let tx = contract.transferFrom(player1, player2, cryptoBotID, { from: player1 });
            expectEvent(tx, 'CryptoBotTransferred', "contract does not emit event");
        });
    });

});

