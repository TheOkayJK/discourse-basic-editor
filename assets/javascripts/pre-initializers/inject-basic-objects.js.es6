import { withPluginApi } from "discourse/lib/plugin-api";
import EmberObject from "@ember/object";
import { computed } from "@ember/object";
import { getOwner } from 'discourse-common/lib/get-owner';
import { iconNode } from "discourse-common/lib/icon-library";

export default {
    name: "inject-basic-objects",
    after: "inject-discourse-objects",
    initialize(container, app) {
        withPluginApi("0.8.31", injectBasicObjects);

    },
};