/**
 * Smart contract migration.
 * For any suggestions please contact me at andrei.dimitrief.jianu(at)gmail.com
 */

var CryptoBots = artifacts.require("./CryptoBots.sol");

module.exports = function(deployer) 
{
    deployer.deploy(CryptoBots);
};
