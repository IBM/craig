const {
  isNullOrEmptyString,
  isEmpty,
  isIpv4CidrOrAddress,
  containsKeys,
  validPortRange,
  isInRange,
  distinct,
  contains,
  flatten,
  splat,
  isWholeNumber,
  anyAreEmpty,
  nullOrEmptyStringFields,
} = require("lazy-z");
const {
  invalidName,
  invalidSshPublicKey,
  invalidSecurityGroupRuleName,
  invalidIpCommaList,
  invalidIdentityProviderURI,
  isValidUrl,
  invalidCbrRule,
  invalidCbrZone,
  validRecord,
  invalidDescription,
  invalidDnsZoneName,
  validSshKey,
} = require("./invalid-callbacks");

/**
 * check if a field is null or empty string, reduce unit test writing
 * @param {string} field
 * @param {Object} stateData
 * @returns {boolean} true if null or empty string
 */
function badField(field, stateData) {
  return isNullOrEmptyString(stateData[field]);
}

/**
 * check multiple fields against the same validating regex expression
 * @param {Array} fields list of fields
 * @param {Function} check test fields with this
 * @param {Object} stateData
 * @returns {boolean}
 */
function fieldCheck(fields, check, stateData) {
  let hasBadFields = false;
  fields.forEach((field) => {
    if (!check(stateData[field])) {
      hasBadFields = true;
    }
  });
  return hasBadFields;
}

/**
 * test if a rule has an invalid port
 * @param {*} rule
 * @param {boolean=} isSecurityGroup
 * @returns {boolean} true if port is invalid
 */
function invalidPort(rule, isSecurityGroup) {
  let hasInvalidPort = false;
  if (rule.ruleProtocol !== "all") {
    (rule.ruleProtocol === "icmp"
      ? ["type", "code"]
      : isSecurityGroup
      ? ["port_min", "port_max"]
      : ["port_min", "port_max", "source_port_min", "source_port_max"]
    ).forEach((type) => {
      if (rule.rule[type] && !hasInvalidPort) {
        hasInvalidPort = !validPortRange(type, rule.rule[type]);
      }
    });
  }
  return hasInvalidPort;
}

/**
 * reduct unit test writing check for number input invalidation
 * @param {*} value
 * @param {*} minRange
 * @param {*} maxRange
 * @returns {boolean} true if any invalid number/range
 */
function invalidNumberCheck(value, minRange, maxRange) {
  let isInvalidNumber = false;
  if (!isNullOrEmptyString(value)) {
    if (!isWholeNumber(value) || !isInRange(value, minRange, maxRange)) {
      isInvalidNumber = true;
    }
  }
  return isInvalidNumber;
}

/**
 * check to see if scc form save should be disabled
 * @param {Object} stateData
 * @returns {boolean} true if save should be disabled
 */
function disableSccSave(stateData) {
  return (
    !/^[A-z][a-zA-Z0-9-\._,\s]*$/i.test(stateData.collector_description) ||
    !/^[A-z][a-zA-Z0-9-\._,\s]*$/i.test(stateData.scope_description)
  );
}

/**
 * check to see if dynamic policies form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableDynamicPoliciesSave(stateData, componentProps) {
  return (
    invalidName("dynamic_policies")(stateData, componentProps) ||
    nullOrEmptyStringFields(stateData, [
      "identity_provider",
      "expiration",
      "conditions",
    ]) ||
    invalidIdentityProviderURI(stateData, componentProps)
  );
}

/**
 * check to see if object storage form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableObjectStorageSave(stateData, componentProps) {
  return (
    invalidName("object_storage")(stateData, componentProps) ||
    nullOrEmptyStringFields(stateData, ["kms", "resource_group"])
  );
}

/**
 * check to see if buckets form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableBucketsSave(stateData, componentProps) {
  return (
    invalidName("buckets")(stateData, componentProps) ||
    badField("kms_key", stateData)
  );
}

/**
 * check to see if secrets manager form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableSecretsManagerSave(stateData, componentProps) {
  return (
    invalidName("secrets_manager")(stateData, componentProps) ||
    nullOrEmptyStringFields(stateData, ["encryption_key", "resource_group"])
  );
}

/**
 * check to see if ssh keys form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableSshKeysSave(stateData, componentProps) {
  return (
    invalidName("ssh_keys")(stateData, componentProps) ||
    isNullOrEmptyString(stateData.resource_group) ||
    (stateData.use_data
      ? false // do not check invalid public key if using data, return false
      : invalidSshPublicKey(stateData, componentProps).invalid)
  );
}

/**
 * check to see if sg rules form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableSgRulesSave(stateData, componentProps) {
  return (
    invalidSecurityGroupRuleName(stateData, componentProps) ||
    !isIpv4CidrOrAddress(stateData.source) ||
    invalidPort(stateData)
  );
}

/**
 * check to see if iam account settings form save should be disabled
 * @param {Object} stateData
 * @returns {boolean} true if should be disabled
 */
function disableIamAccountSettingsSave(stateData) {
  return (
    nullOrEmptyStringFields(stateData, [
      "mfa",
      "restrict_create_platform_apikey",
      "restrict_create_service_id",
      "max_sessions_per_identity",
    ]) || invalidIpCommaList(stateData.allowed_ip_addresses)
  );
}

/**
 * check to see if security groups form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableSecurityGroupsSave(stateData, componentProps) {
  return (
    invalidName("security_groups")(stateData, componentProps) ||
    nullOrEmptyStringFields(stateData, ["resource_group", "vpc"])
  );
}

/**
 * check to see if f5 vsi template form save should be disabled
 * @param {Object} stateData
 * @returns {boolean} true if should be disabled
 */
function disableF5VsiTemplateSave(stateData) {
  let extraFields = {
    none: [],
    byol: ["byol_license_basekey"],
    regkeypool: ["license_username", "license_host", "license_pool"],
    utilitypool: [
      "license_username",
      "license_host",
      "license_pool",
      "license_unit_of_measure",
      "license_sku_keyword_1",
      "license_sku_keyword_2",
    ],
  };
  return (
    nullOrEmptyStringFields(
      stateData,
      ["template_version", "template_source"].concat(
        extraFields[stateData["license_type"]]
      )
    ) ||
    fieldCheck(
      [
        "do_declaration_url",
        "as3_declaration_url",
        "ts_declaration_url",
        "phone_home_url",
        "tgstandby_url",
        "tgrefresh_url",
        "tgactive_url",
      ],
      isValidUrl,
      stateData
    )
  );
}

/**
 * check to see if f5 vsi form save should be disabled
 * @param {Object} stateData
 * @returns {boolean} true if should be disabled
 */
function disableF5VsiSave(stateData) {
  return isEmpty(stateData?.ssh_keys || []);
}

/**
 * check to see if routing tables form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableRoutingTablesSave(stateData, componentProps) {
  return (
    invalidName("routing_tables")(stateData, componentProps) ||
    nullOrEmptyStringFields(stateData, ["vpc"])
  );
}

/**
 * check to see if routes form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableRoutesSave(stateData, componentProps) {
  return (
    invalidName("routes")(stateData, componentProps) ||
    nullOrEmptyStringFields(stateData, [
      "zone",
      "action",
      "next_hop",
      "destination",
    ]) ||
    !isIpv4CidrOrAddress(stateData.destination) ||
    !isIpv4CidrOrAddress(stateData.next_hop) ||
    contains(stateData.next_hop, "/")
  );
}

/**
 * check to see if dns form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableDnsSave(stateData, componentProps) {
  return (
    invalidName("dns")(stateData, componentProps) ||
    badField("resource_group", stateData)
  );
}

/**
 * check to see if zones form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableZonesSave(stateData, componentProps) {
  return (
    invalidDnsZoneName(stateData, componentProps) ||
    nullOrEmptyStringFields(stateData, ["vpcs", "label"]) ||
    isEmpty(stateData.vpcs) ||
    invalidDescription(stateData.description, componentProps)
  );
}

/**
 * check to see if records form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableRecordsSave(stateData, componentProps) {
  return (
    invalidName("records")(stateData, componentProps) ||
    nullOrEmptyStringFields(stateData, ["type", "dns_zone", "rdata"]) ||
    !validRecord(stateData, componentProps)
  );
}

/**
 * check to see if custom resolvers form save should be disabled
 * @param {Object} stateData
 * @param {Object} componentProps
 * @returns {boolean} true if should be disabled
 */
function disableCustomResolversSave(stateData, componentProps) {
  return (
    invalidName("custom_resolvers")(stateData, componentProps) ||
    badField("vpc", stateData) ||
    isEmpty(stateData.subnets) ||
    invalidDescription(stateData.description, componentProps)
  );
}

/**
 * check to see if logna form save should be disabled
 * @param {Object} stateData
 * @returns {boolean} true if should be disabled
 */
function disableLogdnaSave(stateData) {
  return stateData.enabled === true
    ? nullOrEmptyStringFields(stateData, ["plan", "resource_group", "bucket"])
    : false;
}

/**
 * check to see if sysdig form save should be disabled
 * @param {Object} stateData
 * @returns {boolean} true if should be disabled
 */
function disableSysdigSave(stateData) {
  return stateData.enabled === false
    ? false
    : nullOrEmptyStringFields(stateData, ["resource_group", "plan"]);
}

const disableSaveFunctions = {
  scc: disableSccSave,
  access_groups: invalidName("access_groups"),
  policies: invalidName("policies"),
  dynamic_policies: disableDynamicPoliciesSave,
  object_storage: disableObjectStorageSave,
  appid_key: invalidName("appid_key"),
  buckets: disableBucketsSave,
  cos_keys: invalidName("cos_keys"),
  secrets_manager: disableSecretsManagerSave,
  ssh_keys: disableSshKeysSave,
  sg_rules: disableSgRulesSave,
  iam_account_settings: disableIamAccountSettingsSave,
  security_groups: disableSecurityGroupsSave,
  f5_vsi_template: disableF5VsiTemplateSave,
  f5_vsi: disableF5VsiSave,
  routing_tables: disableRoutingTablesSave,
  routes: disableRoutesSave,
  dns: disableDnsSave,
  zones: disableZonesSave,
  records: disableRecordsSave,
  custom_resolvers: disableCustomResolversSave,
  logdna: disableLogdnaSave,
  sysdig: disableSysdigSave,
};

/**
 * disable save
 * @param {string} field field name
 * @param {Object} stateData
 * @param {Object} componentProps
 * @param {lazyZstate=} craig used for subnets, component props do not have craig
 * @returns {boolean} true if match
 */
function disableSave(field, stateData, componentProps, craig) {
  let stateDisableSaveComponents = [
    "vpn_servers",
    "vpn_server_routes",
    "transit_gateways",
    "classic_gateways",
    "load_balancers",
    "classic_vlans",
    "classic_ssh_keys",
    "clusters",
    "worker_pools",
    "opaque_secrets",
    "icd",
    "atracker",
    "resource_groups",
    "key_management",
    "encryption_keys",
    "power",
    "network",
    "cloud_connections",
    "event_streams",
    "power_instances",
    "power_volumes",
    "acl_rules",
    "acls",
    "subnetTier",
    "subnet",
    "vpcs",
    "vsi",
    "volumes",
    "cbr_zones",
    "addresses",
    "exclusions",
    "cbr_rules",
    "contexts",
    "resource_attributes",
    "tags",
    "virtual_private_endpoints",
    "vpn_gateways",
  ];
  let isPowerSshKey = field === "ssh_keys" && componentProps.arrayParentName;
  if (
    containsKeys(disableSaveFunctions, field) &&
    !isPowerSshKey &&
    !componentProps?.classic
  ) {
    return disableSaveFunctions[field](stateData, componentProps, craig);
  } else if (contains(stateDisableSaveComponents, field) || isPowerSshKey) {
    return (
      contains(["network", "cloud_connections"], field)
        ? componentProps.craig.power[field]
        : isPowerSshKey
        ? componentProps.craig.power.ssh_keys
        : field === "classic_ssh_keys"
        ? componentProps.craig.classic_ssh_keys
        : field === "volumes"
        ? componentProps.craig.vsi.volumes
        : field === "acl_rules" && componentProps.isModal
        ? componentProps.craig.vpcs.acls.rules
        : field === "acl_rules"
        ? componentProps.innerFormProps.craig.vpcs.acls.rules
        : field === "subnet"
        ? craig.vpcs.subnets
        : field === "subnetTier"
        ? componentProps.craig.vpcs.subnetTiers
        : field === "acls"
        ? componentProps.craig.vpcs[field]
        : field === "vpn_server_routes"
        ? componentProps.craig.vpn_servers.routes
        : field === "encryption_keys"
        ? componentProps.craig.key_management.keys
        : contains(["worker_pools", "opaque_secrets"], field)
        ? componentProps.craig.clusters[field]
        : contains(["addresses", "exclusions"], field)
        ? componentProps.craig.cbr_zones[field]
        : contains(["contexts", "resource_attributes", "tags"], field)
        ? componentProps.craig.cbr_rules[field]
        : componentProps.craig[field]
    ).shouldDisableSave(stateData, componentProps);
  } else return false;
}

/**
 * check if a cidr is invalid
 * @param {*} value
 * @returns {boolean} true when not a valid cidr
 */
function invalidCidrBlock(value) {
  return isIpv4CidrOrAddress(value || "") === false || !contains(value, "/");
}

/**
 * show non toggle array form
 * depending on the submission field name the code looks determines if the form should be open based on the data passed by componentProps
 * @param {*} stateData
 * @param {*} componentProps
 * @returns {boolean} true if should show
 */
function forceShowForm(stateData, componentProps) {
  let openForm = false;
  if (componentProps.innerFormProps.data.enable === false) {
    return openForm;
  }

  if (componentProps.submissionFieldName === "power") {
    componentProps.innerFormProps.data.ssh_keys.forEach((key) => {
      if (!openForm) {
        openForm = !validSshKey(key.public_key);
      }
    });
  }

  if (!openForm) {
    openForm = disableSave(
      componentProps.submissionFieldName,
      componentProps.innerFormProps.data,
      componentProps.innerFormProps
    );
  }

  return openForm;
}

/**
 * disable ssh key delete
 * @param {*} componentProps
 * @param {*} componentProps.innerFormProps
 * @param {*} componentProps.innerFormProps.data
 * @param {string} componentProps.innerFormProps.data.name
 * @returns {boolean} true if should be disabled
 */
function disableSshKeyDelete(componentProps) {
  let allVsiSshKeys = [];
  ["vsi", "teleport_vsi", "f5_vsi"].forEach((vsi) => {
    allVsiSshKeys = distinct(
      allVsiSshKeys.concat(
        flatten(splat(componentProps.craig.store.json[vsi], "ssh_keys"))
      )
    );
  });
  return contains(allVsiSshKeys, componentProps.innerFormProps.data.name);
}

module.exports = {
  disableSave,
  invalidPort,
  forceShowForm,
  disableSshKeysSave,
  disableSshKeyDelete,
  invalidCidrBlock,
  invalidNumberCheck,
};
