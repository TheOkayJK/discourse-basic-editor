import loadScript from "discourse/lib/load-script";
import { getOwner } from 'discourse-common/lib/get-owner';
import { cookAsync } from "discourse/lib/text";
import { ajax } from "discourse/lib/ajax";
import getURL from "discourse-common/lib/get-url";
import { debounce, later, next, schedule, scheduleOnce } from "@ember/runloop";
import ENV from "discourse-common/config/environment";
export default Ember.Component.extend({
    classNames: ["d-editor"],
    _updatePreview() {
        if (this._state !== "inDOM") {
            return;
        }

        const value = this.value;
        const markdownOptions = this.markdownOptions || {};

        cookAsync(value, markdownOptions).then(cooked => {
            if (this.isDestroyed) {
                return;
            }
            this.set("preview", cooked);
            schedule("afterRender", () => {
                if (this._state !== "inDOM") {
                    return;
                }
                const $preview = $(this.element.querySelector(".d-editor-preview"));
                if ($preview.length === 0) return;

                if (this.previewUpdated) {
                    this.previewUpdated($preview);
                }
            });
        });
    },
    setupBasicEditor() {
        loadScript("/plugins/DiscourseBasicEditor/ckeditor.js").then(() => {
            const component = this;
            ClassicEditor.create(document.querySelector('#editor'), {
                    disUploader: {
                        abort: function(abo) {
                            console.log("abort from the outside", this)
                        }.bind(this),
                        upload: function(file, abo) {
                            const data = new FormData();
                            data.append("type", "composer")
                            const isPrivateMessage = this.get("composer.privateMessage");
                            if (isPrivateMessage) data.append("for_private_message", true)
                            data.append("files[]", file);

                            return ajax(getURL(`/uploads.json?client_id=${this.messageBus.clientId}`), {
                                type: "POST",
                                data: data,
                                contentType: false,
                                processData: false,
                                dataType: "json"
                            }).then(response => {

                                return new Promise((resolve, reject) => {
                                    //  const response = xhr.response;
                                    if (!response || response.error) {
                                        return reject(response && response.error ? response.error.message : "error uploading the file");
                                    }
                                    resolve({
                                        default: response.url
                                    });

                                })




                            }, reason => {

                                console.log("ajaxerro", reason)
                            });


                            /*        const loader = abo.loader;
                                                  if ( xhr.upload ) {
                                                    xhr.upload.addEventListener( 'progress', evt => {
                                                      if ( evt.lengthComputable ) {
                                                        loader.uploadTotal = evt.total;
                                                        loader.uploaded = evt.loaded;
                                                      }
                                                    } );
                                                  }*/



                        }.bind(this),
                    },
                    toolbarItems: [{
                        label: 'Advanced Editor',
                        icon: "code",
                        onClick: function() {
                            this.destroy().then(() => {
                                const composer = getOwner(this).lookup('controller:composer');
                                composer.set('advancedEditor', true)
                            })

                        }
                    }, ]
                })
                .then(function(editor) {

                    editor.ui.view.element.id = "editor_container"

                    editor.setData(this.value)
                    this._updatePreview();
                    editor.model.document.on('change:data', function() {
                        this.set('value', editor.getData());

                        // Debouncing in test mode is complicated
                        if (ENV.environment === "test") {
                            this._updatePreview();
                        } else {
                            debounce(this, this._updatePreview, 30);
                        }



                    }.bind(this));
                    // Focus on the body unless we have a title
                    if (!this.get("composer.canEditTitle")) {
                        editor.editing.view.focus()
                    }


                }.bind(this))
                .catch(error => {
                    console.error(error);
                });
        });
    },

    didInsertElement() {
        this.setupBasicEditor();
    }

});