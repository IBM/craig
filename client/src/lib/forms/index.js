const {
  resourceGroupHelperTextCallback,
  genericNameCallback,
  invalidNameText,
  cosResourceHelperTextCallback,
  aclHelperTextCallback,
  invalidSubnetTierText,
  iamAccountSettingInvalidText,
  invalidSecurityGroupRuleText,
  clusterHelperTestCallback,
  accessGroupPolicyHelperTextCallback,
  invalidCidrText,
  invalidCbrRuleText,
  invalidCbrZoneText,
} = require("./text-callbacks");
const {
  invalidName,
  invalidEncryptionKeyRing,
  invalidSshPublicKey,
  validSshKey,
  invalidIamAccountSettings,
  invalidTagList,
  invalidCrnList,
  invalidSubnetTierName,
  invalidSecurityGroupRuleName,
  invalidNewResourceName,
  invalidIpCommaList,
  invalidIdentityProviderURI,
  invalidF5Vsi,
  isValidUrl,
  cidrBlocksOverlap,
  hasOverlappingCidr,
  invalidCidr,
  invalidProjectDescription,
  invalidCbrRule,
  invalidCbrZone,
} = require("./invalid-callbacks");
const { propsMatchState } = require("./props-match-state");
const {
  disableSave,
  invalidPort,
  forceShowForm,
  disableSshKeyDelete,
  invalidCidrBlock,
} = require("./disable-save");
const { hasDuplicateName } = require("./duplicate-name");
const { getSubnetTierStateData, getTierSubnets } = require("./state-data");
const {
  formatConfig,
  copyAclModalContent,
  copyRuleCodeMirrorData,
  copySgModalContent,
} = require("./format-json");
const {
  setFormRgList,
  defaultFormTemplate,
  setFormVpcList,
  setFormEncryptionKeyList,
  setFormSubnetList,
  setDeleteDisabledMessage,
  setFormSgList,
} = require("./form-props");
module.exports = {
  hasDuplicateName,
  resourceGroupHelperTextCallback,
  genericNameCallback,
  invalidName,
  propsMatchState,
  disableSave,
  clusterHelperTestCallback,
  invalidNameText,
  invalidEncryptionKeyRing,
  cosResourceHelperTextCallback,
  invalidSshPublicKey,
  validSshKey,
  invalidPort,
  invalidTagList,
  aclHelperTextCallback,
  invalidSubnetTierName,
  invalidSubnetTierText,
  formatConfig,
  getSubnetTierStateData,
  getTierSubnets,
  iamAccountSettingInvalidText,
  invalidIamAccountSettings,
  invalidSecurityGroupRuleName,
  invalidSecurityGroupRuleText,
  invalidNewResourceName,
  invalidIpCommaList,
  copyAclModalContent,
  copyRuleCodeMirrorData,
  copySgModalContent,
  forceShowForm,
  accessGroupPolicyHelperTextCallback,
  invalidIdentityProviderURI,
  invalidF5Vsi,
  isValidUrl,
  disableSshKeyDelete,
  cidrBlocksOverlap,
  setFormRgList,
  defaultFormTemplate,
  setFormVpcList,
  hasOverlappingCidr,
  invalidCidr,
  invalidCidrText,
  invalidCrnList,
  setFormEncryptionKeyList,
  setFormSubnetList,
  setDeleteDisabledMessage,
  invalidProjectDescription,
  invalidCbrRule,
  invalidCbrRuleText,
  invalidCbrZone,
  invalidCbrZoneText,
  invalidCidrBlock,
  setFormSgList,
};
