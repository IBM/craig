const { assert } = require("chai");
const {
  formatEventStreams,
  eventStreamsTf,
} = require("../../client/src/lib/json-to-iac/event-streams");

describe("event streams", () => {
  describe("formatEventStreams", () => {
    it("should format event streams instance", () => {
      let actualData = formatEventStreams(
        {
          name: "event-streams",
          plan: "eneterprise",
          resource_group: "slz-service-rg",
          endpoints: "private",
          private_ip_allowlist: ["10.0.0.0/32", "10.0.0.1/32"],
          throughput: "150MB/s",
          storage_size: "2TB",
        },
        {
          _options: {
            tags: ["hello", "world"],
            prefix: "iac",
            region: "us-south",
          },
          resource_groups: [
            {
              use_prefix: true,
              name: "slz-service-rg",
              use_data: false,
            },
            {
              use_prefix: true,
              name: "slz-management-rg",
              use_data: false,
            },
            {
              use_prefix: true,
              name: "slz-workload-rg",
              use_data: false,
            },
          ],
        }
      );
      let expectedData = `
resource "ibm_resource_instance" "event_streams_es" {
  name              = "iac-event-streams"
  service           = "messagehub"
  plan              = "eneterprise"
  location          = "us-south"
  resource_group_id = ibm_resource_group.slz_service_rg.id

  parameters = {
    service-endpoints    = "private"
    private_ip_allowlist = "[10.0.0.0/32,10.0.0.1/32]"
    throughput           = "150"
    storage_size         = "2048"
  }

  timeouts {
    create = "3h"
    update = "1h"
    delete = "1h"
  }
}
`;
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return correct data"
      );
    });
    it("should format event streams instance without optional fields", () => {
      let actualData = formatEventStreams(
        {
          name: "event-streams",
          plan: "eneterprise",
          resource_group: "slz-service-rg",
          endpoints: "private",
        },
        {
          _options: {
            tags: ["hello", "world"],
            prefix: "iac",
            region: "us-south",
          },
          resource_groups: [
            {
              use_prefix: true,
              name: "slz-service-rg",
              use_data: false,
            },
            {
              use_prefix: true,
              name: "slz-management-rg",
              use_data: false,
            },
            {
              use_prefix: true,
              name: "slz-workload-rg",
              use_data: false,
            },
          ],
        }
      );
      let expectedData = `
resource "ibm_resource_instance" "event_streams_es" {
  name              = "iac-event-streams"
  service           = "messagehub"
  plan              = "eneterprise"
  location          = "us-south"
  resource_group_id = ibm_resource_group.slz_service_rg.id

  parameters = {
    service-endpoints = "private"
  }

  timeouts {
    create = "3h"
    update = "1h"
    delete = "1h"
  }
}
`;
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return correct data"
      );
    });
  });
  describe("eventStreamsTf", () => {
    it("should return event streams tf", () => {
      let actualData = eventStreamsTf({
        _options: {
          tags: ["hello", "world"],
          prefix: "iac",
          region: "us-south",
        },
        resource_groups: [
          {
            use_prefix: true,
            name: "slz-service-rg",
            use_data: false,
          },
          {
            use_prefix: true,
            name: "slz-management-rg",
            use_data: false,
          },
          {
            use_prefix: true,
            name: "slz-workload-rg",
            use_data: false,
          },
        ],
        event_streams: [
          {
            name: "event-streams",
            plan: "eneterprise",
            resource_group: "slz-service-rg",
            endpoints: "private",
            private_ip_allowlist: ["10.0.0.0/32", "10.0.0.1/32"],
            throughput: "150MB/s",
            storage_size: "2TB",
          },
        ],
      });
      let expectedData = `##############################################################################
# Event Streams
##############################################################################

resource "ibm_resource_instance" "event_streams_es" {
  name              = "iac-event-streams"
  service           = "messagehub"
  plan              = "eneterprise"
  location          = "us-south"
  resource_group_id = ibm_resource_group.slz_service_rg.id

  parameters = {
    service-endpoints    = "private"
    private_ip_allowlist = "[10.0.0.0/32,10.0.0.1/32]"
    throughput           = "150"
    storage_size         = "2048"
  }

  timeouts {
    create = "3h"
    update = "1h"
    delete = "1h"
  }
}

##############################################################################
`;
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return correct data"
      );
    });
  });
});
