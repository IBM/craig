const {
  getObjectFromArray,
  snakeCase,
  titleCase,
  kebabCase,
  parseIntFromZone,
  isNullOrEmptyString,
  transpose
} = require("lazy-z");
const { RegexButWithWords } = require("regex-but-with-words");
const { endComment } = require("./constants");
const constants = require("./constants");
const { jsonToTf } = require("json-to-tf");

/**
 * get a resource group id using name
 * @param {string} groupName name of resource group
 * @param {object} config json data template
 * @param {Array<object>} config.resource_groups
 * @returns {string} composed resource group
 */
function rgIdRef(groupName, config) {
  if (groupName === null) {
    return "ERROR: Unfound Ref";
  }
  let rg = getObjectFromArray(config.resource_groups, "name", groupName);
  let rgId = `ibm_resource_group.${snakeCase(groupName)}.id`;
  if (rg?.use_data) {
    rgId = "data." + rgId;
  }
  return "${" + rgId + "}";
}

/**
 * get string for tag value
 * @param {Object} config
 * @param {Object} config._options
 * @param {Array<string>} config._options.tags
 * @param {boolean=} useVarRef
 * @returns {string} stringified tags
 */
function getTags(config, useVarRef) {
  return useVarRef ? `\${var.tags}` : config._options.tags;
}

/**
 * get id for cos instance
 * @param {Object} cos
 * @param {boolean} cos.use_data
 * @param {string} cos.name
 * @param {boolean=} getGuid get guid
 * @returns {string} composed cos id
 */
function getCosId(cos, getGuid) {
  return `\${${cos.use_data ? "data." : ""}ibm_resource_instance.${snakeCase(
    cos.name
  )}_object_storage.${getGuid ? "gu" : ""}id}`;
}

/**
 * create a header for terraform
 * @param {string} name name of resource block
 * @returns {string} title comment block
 */
function buildTitleComment(name) {
  return (
    constants.titleComment
      .replace("TITLE", titleCase(name))
      .replace(
        new RegexButWithWords()
          .literal("F")
          .whitespace()
          .literal("5")
          .done("g"),
        "F5"
      )
      .replace(/And/i, "and")
      .replace(/Iam/g, "IAM")
      .replace(/Vpe/g, "VPE")
      .replace(/Ssh(?=\s)/g, "SSH")
      .replace(/Vpc(?=\s)/g, "VPC")
      .replace(/Vsi(?=\s)/g, "VSI")
      .replace(/Vpn(?=\s)/g, "VPN")
      .replace(/Dns(?=\s)/g, "DNS") + "\n"
  );
}

/**
 * get kms instance data
 * @param {string} kmsName instance to look up
 * @param {Object} config config object
 * @param {Array<Object>} config.key_management
 * @returns {{name: string, guid: string}} kms references
 */
function getKmsInstanceData(kmsName, config) {
  let kmsInstance = getObjectFromArray(config.key_management, "name", kmsName);
  let baseName = `${
    kmsInstance.use_data ? "data." : ""
  }ibm_resource_instance.${snakeCase(kmsInstance.name)}.`;
  return {
    name: baseName + "name",
    guid: baseName + "guid",
    type: kmsInstance.use_hs_crypto ? "hs-crypto" : "kms"
  };
}

/**
 * format vpc id
 * @param {string} vpcName
 * @param {string=} value value to get defaults to id
 * @param {string=} useModule get module instead of address
 * @returns {string} formatted id
 */
function vpcRef(vpcName, value, useModule) {
  return `\${${useModule ? "module" : "ibm_is_vpc"}.${snakeCase(
    vpcName
  )}_vpc.${value || "id"}}`;
}

/**
 * create name in kebab case
 * @param {Object} config
 * @param {Object} config._options
 * @param {string} config._options.prefix
 * @param {Array<string>} segments array of substrings
 * @param {string=} addText additional text
 * @returns {string} kebab-case-name
 */
function kebabName(config, segments, addText) {
  return (
    kebabCase(config._options.prefix + "-" + segments.join("-")).replace(
      /-$/,
      ""
    ) + (addText || "")
  );
}

/**
 * get data prefix for resources
 * @param {boolean} useData
 * @returns {string} prefix for data
 */
function useData(useData) {
  return useData ? "data." : "";
}

/**
 * create terraform reference
 * @param {string} type type of resource ex `ibm_resource_instance`
 * @param {string} name name of resource ex `slz-management-rg`
 * @param {string=} value value to get from reference ex `guid`. defaults to `id`
 * @param {boolean=} useData is data reference
 * @returns {string} terraform formatted reference
 */
function tfRef(type, name, value, data) {
  return `\${${useData(data)}${type}.${snakeCase(name)}.${value || "id"}}`;
}

/**
 * shortcut for references to `ibm_resource_instance`
 * @param {string} name name of resource ex `slz-management-rg`
 * @param {string=} value value to get from reference ex `id`
 * @param {boolean=} useData is data reference
 * @returns {string}
 */
function resourceRef(name, value, data) {
  return tfRef("ibm_resource_instance", name, value, data);
}

/**
 * shortcut for references to object storage `ibm_resource_instance`
 * @param {string} name name of resource ex `slz-management-rg`
 * @param {string=} value value to get from reference ex `id`
 * @param {boolean=} useData is data reference
 * @returns {string}
 */
function cosRef(name, value, data) {
  return resourceRef(name + " object storage", value, data);
}

/**
 * shortcut for references to object storage bucket
 * @param {string} cos name of resource ex `slz-management-rg`
 * @param {string} bucket name of bucket
 * @param {string=} value value to get from reference ex `id` defaults to `bucket_name`
 * @param {boolean=} useData is data reference
 * @returns {string}
 */
function bucketRef(cos, bucket, value, data) {
  if (!cos || !bucket) return `ERROR: Unfound ref`;
  return tfRef(
    "ibm_cos_bucket",
    cos + " object storage " + bucket + " bucket",
    value || "bucket_name",
    data
  );
}

/**
 * shortcut for references to `ibm_is_subnet`
 * @param {string} subnet name of resource ex `slz-management-rg`
 * @param {string} vpc vpc name
 * @param {string=} value value to get from reference ex `guid`. defaults to `id`
 * @param {boolean=} useData is data reference
 * @returns {string}
 */
function subnetRef(vpc, subnet, value, data) {
  return tfRef("ibm_is_subnet", `${vpc} ${subnet}`, value, data);
}

/**
 * shortcut for references to `ibm_kms_key`
 * @param {string} key name of resource ex `slz-management-rg`
 * @param {string} kms vpc name
 * @param {string=} value get value, defaults to `key_id`
 * @returns {string}
 */
function encryptionKeyRef(kms, key, value) {
  return tfRef("ibm_kms_key", `${kms} ${key} key`, value || "key_id");
}

/**
 * get subnet zone number from name
 * @param {string} subnet
 * @returns {number} 1, 2, or 3
 */
function subnetZone(subnet) {
  return parseIntFromZone(subnet);
}

/**
 * get composed zone
 * @param {number} zone
 * @returns {string} composed zone
 */
function composedZone(zone, cdktf) {
  let zoneName = `\${var.region}-${zone}`;
  return cdktf ? zoneName.replace(/"/g, "") : zoneName;
}

function tfBlock(title, blockData) {
  return buildTitleComment(title) + blockData + endComment + "\n";
}

/**
 * replace trailing newline
 * @param {string} tf terraform sta
 * @returns {string} terraform data with additional newlines removed
 */
function tfDone(tf) {
  return tf.replace(/\n\n$/g, "\n");
}

/**
 * return name for resource that can be imported from data
 * @param {Object} resource
 * @param {Object} config
 * @param {Object} config._options
 * @param {string} config._options.prefix
 * @param {string} appendText text to add
 * @returns {string} data resource name
 */
function dataResourceName(resource, config, appendText) {
  return `${resource.use_data ? "" : config._options.prefix + "-"}${
    resource.name
  }${appendText ? appendText : ""}`;
}

/**
 * create a reference for within cdktf
 * @param {*} str
 * @return {string} formatted string
 */
function cdktfRef(str) {
  return "${" + str + "}";
}

/**
 * create timeouts block for cdktf
 * @param {string=} create
 * @param {string=} update
 * @param {string=} destroy
 * @returns {Array<object>} timeouts object
 */
function timeouts(create, update, destroy) {
  let block = {};
  if (!isNullOrEmptyString(create)) {
    block.create = create;
  }
  if (!isNullOrEmptyString(update)) {
    block.update = update;
  }
  if (!isNullOrEmptyString(destroy)) {
    block.delete = destroy;
  }
  return [block];
}

/**
 * create string value for kms id reference
 * @param {Object} kms key management instance
 * @param {boolean} kms.use_data use data
 * @param {string} kms.name name of instance
 * @returns {string} composed kms string
 */
function composedKmsId(kms) {
  return `\${${kms.use_data ? "data." : ""}ibm_resource_instance.${snakeCase(
    kms.name
  )}.guid}`;
}

/**
 * create ref for random suffix
 * @param {Object} cos
 * @param {boolean} cos.use_random_suffix
 * @returns {string} cos
 */
function randomSuffix(cos) {
  return cos.use_random_suffix
    ? `-\${random_string.${snakeCase(cos.name)}_random_suffix.result}`
    : "";
}

/**
 * create object for cdktf
 * @param {Object} obj arbitrary object
 * @param {string} resource
 * @param {string} type
 * @param {string} name
 * @param {Object} values
 * @returns {Object} cdktf object
 */
function cdktfValues(obj, resource, type, name, values) {
  let valuesObj = {};
  transpose(obj, valuesObj);
  if (!obj[resource]) {
    obj[resource] = {};
  }
  if (!obj[resource][type]) {
    obj[resource][type] = {};
  }
  obj[resource][type][snakeCase(name)] = values;
  return obj;
}

/**
 * create object for cdktf
 * @param {Object} obj arbitrary object
 * @param {string} resource
 * @param {string} type
 * @param {string} name
 * @param {Object} values
 * @returns {string} cdktf object
 */
function jsonToTfPrint(resource, type, name, values) {
  let data = jsonToTf(
    JSON.stringify(cdktfValues({}, resource, type, name, values))
  );
  return "\n" + data + "\n";
}

/**
 * get data or resource
 * @param {*} resource
 * @returns {string} data if data, resource otherwise
 */
function getResourceOrData(resource) {
  return resource.use_data ? "data" : "resource";
}

module.exports = {
  dataResourceName,
  composedZone,
  subnetZone,
  tfRef,
  resourceRef,
  rgIdRef,
  getTags,
  getCosId,
  buildTitleComment,
  getKmsInstanceData,
  vpcRef,
  kebabName,
  useData,
  subnetRef,
  cosRef,
  encryptionKeyRef,
  bucketRef,
  tfBlock,
  tfDone,
  cdktfRef,
  timeouts,
  composedKmsId,
  randomSuffix,
  jsonToTfPrint,
  cdktfValues,
  getResourceOrData
};
