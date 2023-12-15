const { assert } = require("chai");
const { state } = require("../../client/src/lib/state");

/**
 * initialize store
 * @returns {lazyZState} state store
 */
function newState() {
  let store = new state();
  store.setUpdateCallback(() => {});
  return store;
}

describe("iam", () => {
  describe("iam_account_settings", () => {
    describe("iam_account_settings.init", () => {
      it("should initialize iam account settings", () => {
        let store = new newState();
        assert.deepEqual(
          store.store.json.iam_account_settings,
          {
            enable: false,
            mfa: null,
            allowed_ip_addresses: null,
            include_history: false,
            if_match: null,
            max_sessions_per_identity: null,
            restrict_create_service_id: null,
            restrict_create_platform_apikey: null,
            session_expiration_in_seconds: null,
            session_invalidation_in_seconds: null,
          },
          "it should set defaults"
        );
      });
    });
    describe("iam_account_settings.save", () => {
      it("should set other params except include_history to null when enable is changed from true to false", () => {
        let store = new newState();
        store.store.json.iam_account_settings.enable = true;
        store.iam_account_settings.save({
          include_history: false,
          enable: false,
        });
        assert.deepEqual(
          store.store.json.iam_account_settings.include_history,
          false,
          "it should set value to false"
        );
      });
      it("should update", () => {
        let store = new newState();
        store.iam_account_settings.save({ enable: true });
        assert.deepEqual(
          store.store.json.iam_account_settings.enable,
          true,
          "it should set value to true"
        );
      });
    });
  });
  describe("access_groups", () => {
    /**
     * create an access group
     * @param {lazyZState} store store state store
     */
    function lazyAccessGroup(store) {
      store.access_groups.create({
        name: "test",
        description: "test",
      });
    }
    /**
     * create an access group policy
     * @param {lazyZState} store store state store
     */
    function lazyPolicy(store) {
      store.access_groups.policies.create(
        {
          name: "hi",
          roles: ["Writer"],
          resources: {
            resource_group: "management-rg",
            resource_type: null,
            resource: null,
            service: null,
            resource_instance_id: null,
          },
        },
        {
          innerFormProps: { arrayParentName: "test" },
        }
      );
    }
    describe("access_groups.init", () => {
      it("should initialize access groups", () => {
        let store = newState();
        assert.deepEqual(
          store.store.json.access_groups,
          [],
          "it should have empty array"
        );
      });
    });
    describe("access_groups.onStoreUpdate", () => {
      it("should set resource_group to null if a policy's resource object exists and contains a delete group name", () => {
        let store = newState();
        lazyAccessGroup(store);
        lazyPolicy(store);
        store.resource_groups.delete({}, { data: { name: "management-rg" } });
        assert.deepEqual(
          store.store.json.access_groups[0].policies[0].resources
            .resource_group,
          null,
          "it should set unfound group to null"
        );
      });
    });
    describe("access_groups.create", () => {
      it("should create a new access group", () => {
        let store = newState();
        lazyAccessGroup(store);
        assert.deepEqual(
          store.store.json.access_groups,
          [
            {
              name: "test",
              description: "test",
              policies: [],
              dynamic_policies: [],
              has_invites: false,
              invites: {
                group: "test",
                ibm_ids: [],
              },
            },
          ],
          "it should create an access group"
        );
      });
    });
    describe("access_groups.save", () => {
      it("should update a new access group", () => {
        let store = newState();
        lazyAccessGroup(store);
        store.access_groups.save(
          {
            name: "frog",
            invites: {
              group: "test",
              ibm_ids: [],
            },
          },
          { data: { name: "test" } }
        );
        assert.deepEqual(
          store.store.json.access_groups,
          [
            {
              name: "frog",
              description: "test",
              policies: [],
              dynamic_policies: [],
              has_invites: false,
              invites: {
                group: "frog",
                ibm_ids: [],
              },
            },
          ],
          "it should create an access group"
        );
      });
    });
    describe("access_groups.delete", () => {
      it("should delete a new access group", () => {
        let store = newState();
        lazyAccessGroup(store);
        store.access_groups.delete({}, { data: { name: "test" } });
        assert.deepEqual(
          store.store.json.access_groups,
          [],
          "it should be empty"
        );
      });
    });
    describe("access_groups.policies", () => {
      describe("access_groups.policies.create", () => {
        it("should create an access policy in an existing access group", () => {
          let store = newState();
          lazyAccessGroup(store);
          lazyPolicy(store);
          assert.deepEqual(
            store.store.json.access_groups[0].policies[0],
            {
              group: "test",
              name: "hi",
              roles: ["Writer"],
              resources: {
                resource_group: "management-rg",
                resource_type: null,
                resource: null,
                service: null,
                resource_instance_id: null,
              },
            },
            "it should create policy"
          );
        });
      });
      describe("access_group.policies.save", () => {
        it("should update an access policy in an existing access group", () => {
          let store = newState();
          lazyAccessGroup(store);
          lazyPolicy(store);
          store.access_groups.policies.save(
            {
              resources: {
                resource_group: "management-rg",
                resource_type: null,
                resource: null,
                service: "cloud-object-storage",
                resource_instance_id: null,
              },
            },
            {
              arrayParentName: "test",
              data: {
                name: "hi",
              },
            }
          );
          assert.deepEqual(
            store.store.json.access_groups[0].policies[0],
            {
              name: "hi",
              roles: ["Writer"],
              resources: {
                resource_group: "management-rg",
                resource_type: null,
                resource: null,
                service: "cloud-object-storage",
                resource_instance_id: null,
              },
              group: "test",
            },
            "it should create policy"
          );
        });
      });
      describe("access_groups.policies.delete", () => {
        it("should delete an access policy in an existing access group", () => {
          let store = newState();
          lazyAccessGroup(store);
          lazyPolicy(store);
          store.access_groups.policies.delete(
            {},
            { arrayParentName: "test", data: { name: "hi" } }
          );
          assert.deepEqual(
            store.store.json.access_groups[0].policies,
            [],
            "it should have no policies"
          );
        });
      });
      describe("access_group.policies.schema", () => {
        let craig;
        beforeEach(() => {
          craig = newState();
        });
        it("should return helper text for name", () => {
          assert.deepEqual(
            craig.access_groups.policies.name.helperText(
              { name: "policy" },
              {
                craig: {
                  store: {
                    json: {
                      _options: {
                        prefix: "test",
                      },
                    },
                  },
                },
              }
            ),
            "test-policy",
            "it should display data"
          );
        });
        it("should not have resource group as invalid when empty string", () => {
          assert.isFalse(
            craig.access_groups.policies.resource_group.invalid({
              resource_group: "",
            }),
            "it should be valid"
          );
        });
      });
    });
    describe("access_groups.dynamic_policies", () => {
      describe("access_groups.dynamic_policies.create", () => {
        it("should create a dynamic access policy in an existing access group", () => {
          let store = newState();
          lazyAccessGroup(store);
          store.access_groups.dynamic_policies.create(
            {
              name: "frog",
              identity_provider: "todd",
              expiration: 2,
              conditions: {
                claim: "claim",
                operator: "EQUALS",
                value: "value",
              },
            },
            { innerFormProps: { arrayParentName: "test" } }
          );
          assert.deepEqual(
            store.store.json.access_groups[0].dynamic_policies[0],
            {
              group: "test",
              name: "frog",
              identity_provider: "todd",
              expiration: 2,
              conditions: {
                claim: "claim",
                operator: "EQUALS",
                value: "value",
              },
            },
            "it should create the policy"
          );
        });
      });
      describe("store.access_groups.dynamic_policies.save", () => {
        it("should update a dynamic access policy in an existing access group", () => {
          let store = newState();
          lazyAccessGroup(store);
          store.access_groups.dynamic_policies.create(
            {
              name: "frog",
              identity_provider: "todd",
              expiration: 2,
              conditions: {
                claim: "claim",
                operator: "EQUALS",
                value: "value",
              },
            },
            { innerFormProps: { arrayParentName: "test" } }
          );
          store.access_groups.dynamic_policies.save(
            { expiration: 3 },
            { arrayParentName: "test", data: { name: "frog" } }
          );
          assert.deepEqual(
            store.store.json.access_groups[0].dynamic_policies[0],
            {
              group: "test",
              name: "frog",
              identity_provider: "todd",
              expiration: 3,
              conditions: {
                claim: "claim",
                operator: "EQUALS",
                value: "value",
              },
            },
            "it should create the policy"
          );
        });
      });
      describe("store.access_groups.dynamic_policies.delete", () => {
        it("should delete a dynamic access policy in an existing access group", () => {
          let store = newState();
          lazyAccessGroup(store);
          store.access_groups.dynamic_policies.create(
            {
              name: "frog",
              identity_provider: "todd",
              expiration: 2,
              conditions: {
                claim: "claim",
                operator: "EQUALS",
                value: "value",
              },
            },
            {
              innerFormProps: { arrayParentName: "test" },
            }
          );
          store.access_groups.dynamic_policies.delete(
            {},
            { arrayParentName: "test", data: { name: "frog" } }
          );
          assert.isEmpty(
            store.store.json.access_groups[0].dynamic_policies,
            "it should have no dynamic policies"
          );
        });
      });
      describe("access_groups.dynamic_policies.schema", () => {
        let craig;
        beforeEach(() => {
          craig = newState();
        });
        it("should have valid expiration when empty string", () => {
          assert.isFalse(
            craig.access_groups.dynamic_policies.expiration.invalid({
              expiration: "",
            }),
            "it should be valid"
          );
        });
        it("should be invalid when no identity provider", () => {
          assert.isTrue(
            craig.access_groups.dynamic_policies.identity_provider.invalid({}),
            "it should be invalid"
          );
        });
        it("should have invalid expiration when out of range", () => {
          assert.isTrue(
            craig.access_groups.dynamic_policies.expiration.invalid({
              expiration: "29",
            }),
            "it should be invalid"
          );
        });
        it("should hide helper text for claim", () => {
          assert.isNull(
            craig.access_groups.dynamic_policies.claim.helperText(),
            "it should be hidden"
          );
        });
        it("should set state on condition state change", () => {
          let data = {
            claim: "aa",
            conditions: {},
          };
          craig.access_groups.dynamic_policies.claim.onStateChange(data);
          assert.deepEqual(
            data,
            {
              claim: "aa",
              conditions: {
                claim: "aa",
              },
            },
            "it should be hidden"
          );
        });
        it("should set state on condition state change", () => {
          let data = {
            claim: "aa",
          };
          craig.access_groups.dynamic_policies.claim.onStateChange(data);
          assert.deepEqual(
            data,
            {
              claim: "aa",
              conditions: {
                claim: "aa",
              },
            },
            "it should be hidden"
          );
        });
        it("should return correct value on render for operator when empty string", () => {
          assert.deepEqual(
            craig.access_groups.dynamic_policies.operator.onRender({
              conditions: {
                operator: "",
              },
            }),
            "",
            "it should return correct data"
          );
        });
        it("should return correct value on render for operator when value", () => {
          assert.deepEqual(
            craig.access_groups.dynamic_policies.operator.onRender({
              conditions: {
                operator: "NOT_EQUALS_IGNORE_CASE",
              },
            }),
            "Not Equals (Ignore Case)",
            "it should return correct data"
          );
        });
        it("should return correct value on state change for operator when value", () => {
          let data = {
            operator: "Not Equals (Ignore Case)",
            conditions: {},
          };
          craig.access_groups.dynamic_policies.operator.onStateChange(data),
            assert.deepEqual(
              data.conditions.operator,
              "NOT_EQUALS_IGNORE_CASE",
              "it should return correct data"
            );
        });
        it("should return correct value on state change for operator when value", () => {
          let data = {
            operator: "Not Equals (Ignore Case)",
          };
          craig.access_groups.dynamic_policies.operator.onStateChange(data),
            assert.deepEqual(
              data.conditions.operator,
              "NOT_EQUALS_IGNORE_CASE",
              "it should return correct data"
            );
        });
        it("should return correct value on state change for operator when empty string", () => {
          let data = {
            operator: "",
            conditions: {},
          };
          craig.access_groups.dynamic_policies.operator.onStateChange(data),
            assert.deepEqual(
              data.conditions.operator,
              "",
              "it should return correct data"
            );
        });
      });
    });
  });
});
