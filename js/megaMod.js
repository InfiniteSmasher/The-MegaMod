class MegaMod {   
    static debug = false; // TODO: Add different debug levels
    static local = false;
    static fatalErr = false;
    static sourceModified = false;
    static KEYS = {
        InitFinished: "megaMod_initFinished",
        Updated: "megaMod_updated",
        ErrVersion: "megaMod_fatalErrorVersion",
        ErrReloads: "megaMod_errorReloads"
    };

    static setDebug(debug) {
        this.debug = debug;
    }

    static setLocal(local) {
        this.local = local;
    }

    static setFatalErr(fatalErr) {
        this.fatalErr = fatalErr;
    }

    static setSourceModified(sourceModified) {
        this.sourceModified = sourceModified;
    }

    static addHTMLEdits() {
        this.log("addHTMLEdits() -", "Adding HTML Edits");
        
        // MegaMod UI
        const messages = `
        <div v-show="reloadNeeded && (showModsTab || showSettingsTab)" class="roundme_md mod-msg reload ss_margintop_lg ss_marginbottom_lg">
            <div>
                <button class="dismiss_btn clickme roundme_sm" @click="dismissRefresh"><i class="fas fa-times text_red fa-2x"></i></button>
                <h4 v-html="loc.p_settings_mods_reload_title"></h4>
                <span>
                    <p v-html="loc.p_settings_mods_reload_desc1"></p>
                    <p v-html="reloadModTxt"></p>
                    <p v-html="loc.p_settings_mods_reload_desc2"></p>
                </span>
                <button class="fa ss_button btn_red bevel_red fullwidth" style="margin-bottom: 0 !important;" @click="refreshPage"><i class="fas fa-sync"></i> Reload Page</button>
            </div>
        </div>
        <div v-show="!reloadNeeded && (showModsTab || showSettingsTab && currentMod.noSettings)" class="roundme_md mod-msg info ss_margintop_lg ss_marginbottom_lg">
            <div>
                <h4 v-html="loc.p_settings_mods_info_title"></h4>
                <span>
                    <p v-html="loc.p_settings_mods_info_desc1"></p>
                    <p v-html="loc.p_settings_mods_info_desc2"></p>
                    <p style="margin-bottom: 0;" v-html="loc.p_settings_mods_info_desc3"></p>
                </span>
            </div>
        </div>
        `;
        
        const settingConditional = `
        <div v-if="s.type === SettingType.Slider">
            <div class="nowrap" v-show="eval(s.showCondition)">
                <settings-adjuster :loc="loc" :loc-key="s?.locKey" :control-id="s.id" :control-value="s.value" :min="s.min" :max="s.max" :step="s.step" :multiplier="s.multiplier" :precision="s.precision" @setting-adjusted="onSettingAdjusted" @setting-input="onSliderInput"></settings-adjuster>
            </div>
        </div>
    
        <div v-if="s.type === SettingType.Toggler">
            <div class="nowrap" v-show="eval(s.showCondition)">
                <settings-toggler :loc="loc" :loc-key="s?.locKey" :control-id="s.id" :control-value="s.value" @setting-toggled="onSettingToggled"></settings-toggler>
            </div>
        </div>
    
        <div v-if="s.type === SettingType.Keybind">
            <div class="nowrap" v-show="eval(s.showCondition)">
                <settings-control-binder :loc="loc" :control-id="s.id" :control-value="s.value" @control-captured="onGameControlCaptured"></settings-control-binder>
                <div class="label">{{ loc[s?.locKey ?? ''] || s?.locKey }}</div>
            </div>
        </div>
    
        <div v-if="s.type === SettingType.Select">
            <div v-show="eval(s.showCondition)">
                <h3 class="margin-bottom-none h-short">{{ loc[s?.locKey ?? ''] || s?.locKey }}</h3>
                <select :id="s.id" @change="onSelectChanged(s.id, $event.target.options[$event.target.selectedIndex].id)" class="ss_select ss_marginright_sm ss_select">
                    <option v-for="o in s.options" :id="o.id" :selected="o.id === s.value">{{ loc[o?.locKey ?? ''] || o?.locKey }}</option>
                </select>
            </div>
        </div>
        <div v-if="s.type === SettingType.HTML">
            <div v-show="eval(s.showCondition)">
                <h3 class="margin-bottom-none h-short" v-if="s?.locKey">{{ loc[s?.locKey ?? ''] || s?.locKey }}</h3>
                <div v-html="s.html"></div>
            </div>
        </div>
         <div v-if="s.type === SettingType.Button">
            <h3 class="margin-bottom-none h-short" v-if="s?.locKey">{{ loc[s?.locKey ?? ''] || s?.locKey }}</h3>
            <button
                :disabled="eval(s.disableCondition)"
                :class="s?.class ?? ''"
                v-bind:onclick="s?.onclick || null"
                >{{ loc[s?.btnLocKey || ''] || s?.btnLocKey }}</button>
        </div>
        <div v-if="s.type === SettingType.ColorPicker">
            <div v-show="eval(s.showCondition)">
                <h3 class="margin-bottom-none h-short">{{ loc[s?.locKey ?? ''] || s?.locKey }}</h3>
                <span class="color-picker-wrapper">
                    <div class="icon-bg">
                        <i class="fas fa-eye-dropper"></i>
                    </div>
                    <input type="color" :value="s.value" @input="onColorPickerInput(s.id, $event.target.value)" @change="BAWK.play('ui_onchange');" class="ss_color_picker"></select>
                </span>
            </div>
        </div>
        <div v-if="s.type === SettingType.TagInput">
            <div v-show="eval(s.showCondition)">
                <h3 class="margin-bottom-none h-short">{{ loc[s?.locKey ?? ''] || s?.locKey }}</h3>
                <tag-input
                    :loc="loc"
                    :modId="s.id"
                    :disabled="eval(s.disableCondition)"
                    :tags="s.value"
                    :placeholder="s.placeholder"
                    @update-tags="onTagInputUpdate"
                ></tag-input>
            </div>
        </div>
        `;
    
        const settings = document.getElementById("settings-template");
        settings.innerHTML = settings.innerHTML.replace(
            'column-3-eq', 'column-5-custom'
        ).replace(`</div>\n\n    <div`, `
            <button id="mod_button" @click="switchTab('mod_button')" class="ss_bigtab bevel_blue ss_bigtab bevel_blue roundme_md font-sigmar f_row align-items-center justify-content-center gap-sm" :class="(showModsTab ? 'selected' : '')">
                <i class="fas fa-tools fa-lg"></i>
            </button>
            <button id="settings_button" @click="openMegaModSettings" @mouseenter="settingsTabHover" class="ss_bigtab settingstab bevel_blue roundme_md font-sigmar f_row align-items-center justify-content-center gap-sm" :class="(showSettingsTab ? 'selected' : '')">
                <i v-if="showSettingsTab && currentMod?.id !== 'megaMod'" class="fas fa-cog fa-lg"></i>
                <img v-if="!showSettingsTab || currentMod?.id === 'megaMod'" src="${rawPath}/img/assets/icons/megaMod-gear.svg">
            </button>
            </div>\n\n    <div`
        ).replace(`toggler>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>`, `toggler>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>
            <div id="settings_mods" v-show="showModsTab" class="settings-section">
                <h3 class="margin-bottom-none h-short" v-html="loc.p_settings_mods_title"></h3>
                <div class="mod-container">
                    <transition :name="pageDirectionForward ? 'slide-left' : 'slide-right'" mode="out-in">
                        <div :key="currentPage" class="display-grid grid-column-2-eq">
                            <div v-for="s in paginatedSettings" :key="s.id" v-show="eval(s?.showCondition ?? true)" class="f_col">
                                <div v-if="s.type === SettingType.Toggler">
                                    <div class="nowrap" :class="s.showInfo ? 'has-settings' : ''">
                                    <settings-toggler
                                        :loc="loc"
                                        :loc-key="s.locKey + '_title'"
                                        :control-id="s.id"
                                        :control-value="s.value"
                                        @setting-toggled="onSettingToggled"
                                    ></settings-toggler>
                                    <span v-if="s.showInfo" @click="showModSettings(s.id)">
                                        <i class="fas fa-cog modsettings-icon" @mouseenter="modSettingsHover"></i>
                                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>

                 <div class="pagination-controls">
                    <button @click="prevPage" :disabled="currentPage === 1" class="pagination-button">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span v-for="page in totalPages" :key="page" class="dot-icon" @click="goToPage(page)">
                        <i :class="page === currentPage ? 'fas fa-circle selected' : 'far fa-circle'"></i>
                    </span>
                    <button @click="nextPage" :disabled="currentPage === totalPages" class="pagination-button">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                ${messages}
            </div>
            <div id="settings_modSettings" v-show="showSettingsTab" class="settings-section">
                <h3 class="margin-bottom-none h-short"><i class='fas fa-info-circle'></i> {{ loc[currentMod?.locKey ? currentMod?.locKey + '_title': ''] || '' }} | Info{{ (currentMod && !currentMod.noSettings) ? ' + Settings' : '' }}</h3>
                <p v-html="loc[currentMod?.locKey ? currentMod?.locKey + '_desc' : ''] || ''" class="mod-desc"></p>
                <p v-show="currentMod && currentMod.noSettings" class="no-additional-settings"><br>No Additional Settings :)</br></p>
                <div class="display-grid grid-column-2-eq">
                    <div v-if="currentMod && !currentMod.noSettings" v-for="s in currentMod?.settings.filter(s => !s.disabled) || []" class="f_col">
                        ${settingConditional}
                        <div v-if="s.type === SettingType.Group">
                            <div v-show="eval(s.showCondition)">
                                <h3 class="margin-bottom-none h-short" v-if="s?.locKey">{{ loc[s?.locKey ?? ''] || s?.locKey }}</h3>
                                <div v-if="s.settings && s.settings.length" v-for="x in s?.settings.filter(s => !s.disabled) || []" class="f_col">
                                    ${settingConditional.replaceAll("s.", "x.").replaceAll("s?.", "x?.")}
                                    <div v-if="x.type === SettingType.Group">
                                        <div v-show="eval(x.showCondition)">
                                            <h3 class="margin-bottom-none h-short" v-if="x.locKey">{{ loc[x?.locKey ?? ''] || x?.locKey }}</h3>
                                            <div v-if="x.settings && x.settings.length" v-for="y in x?.settings.filter(s => !s.disabled) || []" class="f_col">
                                                ${settingConditional.replaceAll("s.", "y.").replaceAll("s?.", "y?.")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ${messages}
            </div>
        </div>`
        );
        const tagInputTemplate = document.createElement('script');
        tagInputTemplate.id = 'tag-input-template';
        tagInputTemplate.type = 'text/x-template';
        tagInputTemplate.innerHTML = `
            <div class="tag-container">
                <div class="tag-box" ref="tagBox" :class="{ disabled }" @click="$refs.input.focus()">
                    <span v-for="(tag, index) in tags" :key="tag" class="tag">
                    <span class="tag-label">{{ tag }}</span>
                    <span class="tag-remove" @click="removeTag(index)">
                        <i class="fas fa-trash-alt"></i>
                    </span>
                    </span>
                </div>
                <input
                    class="ss_field tag-input"
                    ref="input"
                    type="text"
                    v-model="inputValue"
                    @keydown="handleKeydown"
                    :placeholder="placeholder"
                    :disabled="disabled"
                />
            </div>

        `.trim();
        settings.parentNode.insertBefore(tagInputTemplate, settings.nextSibling);
        unsafeWindow.comp_tag_input = {
            template: '#tag-input-template',
            props: {
                loc: {
                    type: Object,
                    default: () => ({})
                },
                modId: {
                    type: String,
                    default: () => ""
                },
                disabled: {
                    type: Boolean,
                    default: false
                },
                tags: {
                    type: Array,
                    default: () => []
                },
                placeholder: {
                    type: String,
                    default() {
                        return typeof loc !== 'undefined' && loc.p_settings_tag_input_placeholder
                        ? loc.p_settings_tag_input_placeholder
                        : 'Type & Press Enter';
                    }
                }
            },
            data() {
                return {
                    inputValue: '',
                };
            },
            mounted() {
                this.scrollToBottom();
            },
            methods: {
                scrollToBottom() {
                    this.$nextTick(() => {
                        const tagBox = this.$refs.tagBox;
                        if (tagBox) tagBox.scrollTop = tagBox.scrollHeight;
                    });
                },
                handleKeydown(e) {
                    if (this.disabled) return;

                    const value = this.inputValue.trim();
                    if (e.key === 'Enter') {
                        if (value && !this.tags.includes(value)) {
                            e.preventDefault();
                            this.tags.push(value);
                            this.inputValue = '';
                            this.$emit('update-tags', this.modId, this.tags);
                            this.scrollToBottom();
                            BAWK.play("ui_onchange");
                        } else {
                            BAWK.play("ui_reset");
                        }
                    }
                },
                removeTag(index) {
                    if (this.disabled) return;
                    this.tags.splice(index, 1);
                    this.$emit('update-tags', this.modId, this.tags);
                    BAWK.play("ui_reset");
                }
            }
        };
        Object.assign(comp_settings.components, {
            'tag-input': unsafeWindow.comp_tag_input
        });
        Object.assign(comp_settings.watch, {
            
        });
        Object.assign(comp_settings.computed, {
            totalPages() {
                return Math.ceil(this.filteredSettings.length / this.pageSize);
            },
            paginatedSettings() {
                const start = (this.currentPage - 1) * this.pageSize;
                return this.filteredSettings.slice(start, start + this.pageSize);
            }
        });

        const adjusterTemplate = document.getElementById("settings-adjuster-template");
        adjusterTemplate.innerHTML = adjusterTemplate.innerHTML.replace(`@change="onChange"`, `@change="onChange" @input="onInput"`)
        comp_settings_adjuster.methods.onInput = function (event) { this.$emit('setting-input', this.controlId, this.currentValue); };
        
        const oldSettingsData = comp_settings.data;
        comp_settings.data = function() {
            return {
                ...oldSettingsData.call(this),
                showModsTab: false,
                showSettingsTab: false,
                reloadNeeded: false,
                reloadModTxt: "",
                currentMod: null,
                flashTimeouts: [],
                filteredSettings: [],
                currentPage: 1,
                pageSize: 10,
                pageDirectionForward: true
            };
        };
    
        const oldSettingsClick = comp_account_panel.methods.onSettingsClick;
        comp_account_panel.methods.onSettingsClick = function() {
            oldSettingsClick.call(this);
            if (vueApp.$refs.settings.showSettingsTab) {
                vueApp.$refs.settings.showSettingsTab = false;
                vueApp.$refs.settings.showModsTab = true;
            }
        };
    
        const {
            switchTab: oldSwitchTab,
            onResetClick: oldResetSettingsFunc,
            onSaveClick: oldSaveSettingsFunc
        } = comp_settings.methods;
        Object.assign(comp_settings.methods, {
            switchTab(tab, modId) {
                oldSwitchTab.call(this, tab);
    
                this.showModsTab = false;
                this.showSettingsTab = false;
                this.currentMod = null;
                switch (tab) {
                    case 'mod_button':
                        this.showModsTab = true;
                        if (extern?.modSettingEnabled?.("megaMod_sfx_tabs")) BAWK.play("modTab");
                        break;
                    case 'settings_button':
                        this.currentMod = this.settingsUi.modSettings.find(m => m.id === modId);
                        // Eh this is a lazy solution but hey it works
                        switch(modId) {
                            case "themeManager":
                                unsafeWindow.megaMod.customTheme.setThemeDesc(); 
                                break;
                            case "customSkybox":
                                if (!unsafeWindow.megaMod.customSkybox.usingSkyboxColor) unsafeWindow.megaMod.customSkybox.updateSkyboxPreview();
                                break;
                            case "customCrosshair":
                                unsafeWindow.megaMod.customCrosshair.setScopeDesc(); 
                                unsafeWindow.megaMod.customCrosshair.updateScopePreview();
                        }
                        this.showSettingsTab = true;
                        if (extern?.modSettingEnabled?.("megaMod_sfx_tabs")) BAWK.play("settingsTab");
                        break;
                }
            },
            onResetClick() {
                this.resetModSettings();
                oldResetSettingsFunc.call(this);
            },
            onSaveClick() {
                this.saveModSettings();
                oldSaveSettingsFunc.call(this);
            },
            initModSetting(setting, parentId) {
                const initSettings = (settings, parentId) => {
                    if (!settings) return [];
                    settings = settings.filter(setting => !setting.disabled);
                    settings.forEach(s => {
                        if (settings.settings) settings.settings = initSettings(settings.settings, (s.type === SettingType.Group ? (s?.parentId || parentId) : s.id));
                        this.initModSetting(s, parentId);
                    });
                    return settings;
                };
    
                const ignoreSetting = [SettingType.Group, SettingType.HTML, SettingType.Button].includes(setting.type);
                let storedSetting;
                switch (setting.type) {
                    case SettingType.Slider:
                        storedSetting = localStore.getNumItem(setting.id);
                        break;
                    case SettingType.Toggler:
                        storedSetting = localStore.getBoolItem(setting.id);
                        break;
                    case SettingType.TagInput:
                        storedSetting = localStore.getObjItem(setting.id);
                        break;
                    default:
                        storedSetting = localStore.getItem(setting.id);
                }
                // Validate storedSetting
                if (storedSetting === "undefined") storedSetting = null;
                if (storedSetting != null && !ignoreSetting) {
                    switch (setting.type) {
                        case SettingType.Slider:
                            if (typeof storedSetting !== "number" || storedSetting > setting.max || storedSetting < setting.min || (setting.step && storedSetting % setting.step !== 0)) storedSetting = null;
                            break;
                        case SettingType.Toggler:
                            if (typeof storedSetting !== "boolean") storedSetting = null;
                            break;
                        case SettingType.Keybind:
                            if (typeof storedSetting !== "string") storedSetting = null;
                            break;
                        case SettingType.Select:
                            if (setting.options.length && !setting.options.map(o => o.id).includes(storedSetting)) storedSetting = null;
                            break;
                        case SettingType.ColorPicker:
                            if (typeof storedSetting !== "string" || !/^#[0-9A-F]{6}$/i.test(storedSetting)) storedSetting = null;
                            break;
                        case SettingType.TagInput:
                            if (!Array.isArray(storedSetting)) storedSetting = null;
                            break;
                    }
                }
                if (!ignoreSetting) {
                    if (storedSetting == null) localStore.setItem(setting.id, typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value))
                    setting.storedVal = (storedSetting != null) ? storedSetting : (setting.type === SettingType.TagInput) ? [...setting.defaultVal] : setting.defaultVal;
                    setting.refreshReq = setting.refreshReq != null && setting.refreshReq;
                }
                Object.assign(setting, {
                    disabled: !setting.active || unsafeWindow.megaMod.regexErrs.includes(setting.id),
                    value: (storedSetting != null) ? storedSetting : (setting.type === SettingType.TagInput) ? [...setting.defaultVal] : setting.defaultVal,
                    settings: initSettings(setting.settings, (setting.type === SettingType.Group ? (setting?.parentId || parentId) : setting.id)) || [],
                    showCondition: setting.showCondition || 'true',
                    disableCondition: setting.disableCondition || 'false',
                    parentId: parentId || null
                });
                return setting;
            },
            initModSettings() {
                this.settingsUi.modSettings = this.settingsUi.modSettings/*.filter(mod => mod.active && !unsafeWindow.megaMod.regexErrs.includes(mod.id))*/.map(mod => {
                    mod = this.initModSetting(mod);
                    Object.assign(mod, {
                        noSettings: !mod?.settings?.filter(s => !s.disabled).length,
                        showInfo: this.loc[mod.locKey ? `${mod.locKey}_desc` : ''] != null || mod?.settings?.length
                    });
                    return mod;
                });
                this.filteredSettings = this.settingsUi.modSettings.filter(s => !s.disabled && s.id !== 'megaMod');
            },
            updateSettingTab() {
                // Meh.
                if (this.showModsTab) {
                    this.showModsTab = false;
                    this.showModsTab = true;
                } else if (this.showSettingsTab) {
                    this.showSettingsTab = false;
                    this.showSettingsTab = true;
                }
            },
            showModSettings(modId) {
                this.switchTab("settings_button", modId);
                this.updateSettingTab();
            },
            checkReloadNeeded() {
                const isReloadNeeded = (setting) => (setting.refreshReq && setting.value !== setting.storedVal) || (setting.settings && setting.settings.some(isReloadNeeded));
                const collectLeafReloadNeededIds = (settings) => {
                    const result = [];
                    const traverse = (setting) => {
                        if (isReloadNeeded(setting)) {
                            // If it has nested reload-needed settings, skip this one
                            if (setting.settings && setting.settings.some(isReloadNeeded)) {
                                setting.settings.forEach(traverse);
                            } else if (setting.id) {
                                result.push(setting.id);
                            }
                        }
                    };
                    settings.forEach(traverse);
                    return result;
                };
                const reloadSettings = collectLeafReloadNeededIds(this.settingsUi.modSettings);
                this.reloadNeeded = reloadSettings.length;
                this.reloadModTxt = this.loc['p_settings_mods_reload_affected'].format(MegaMod.getModNames(reloadSettings).join(", "));
            },
            resetModSetting(setting) {
                if (![SettingType.Group, SettingType.HTML, SettingType.Button].includes(setting.type) && setting.value !== setting.defaultVal) {
                    switch (setting.type) {
                        case SettingType.Slider:
                            this.onSettingAdjusted(setting.id, setting.defaultVal);
                            break;
                        case SettingType.Toggler:
                            this.onSettingToggled(setting.id, setting.defaultVal);
                            break;
                        case SettingType.Keybind:
                            this.onGameControlCaptured(setting.id, setting.defaultVal);
                            break;
                        case SettingType.Select:
                            this.onSelectChanged(setting.id, setting.defaultVal);
                            break;
                        case SettingType.ColorPicker:
                            this.onColorPickerInput(setting.id, setting.defaultVal);
                            break;
                        case SettingType.TagInput:
                            this.onTagInputUpdate(setting.id, [...setting.defaultVal]);
                            break;
                    }
                    this.updateSettingTab();
                }
            },
            resetModSettings() {
                const resetSetting = (setting) => {
                    this.resetModSetting(setting);
                    if (setting.settings) setting.settings.forEach(resetSetting);
                };
                this.settingsUi.modSettings.forEach(resetSetting);
                this.updateSettingTab();
                this.checkReloadNeeded();
            },
            saveModSettings() {
                const saveSetting = (setting) => {
                    if (![SettingType.Group, SettingType.HTML, SettingType.Button].includes(setting.type)) {
                        if (setting.storedVal != setting.value) {
                            localStore.setItem(setting.id, typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value));
                            setting.storedVal = setting.value;
                        }
                    }
                    if (setting.settings) setting.settings.forEach(saveSetting);
                };
                this.settingsUi.modSettings.forEach(saveSetting);
            },
            refreshPage() {
                BAWK.play("ui_playconfirm");
                this.onSaveClick();
                unsafeWindow.location.reload();
            },
            applyOriginalSettings() {
                vueData.settingsUi = this.originalSettings;
                this.showDetailSettings = !vueData.settingsUi.togglers.misc.find( a => { return a.id === 'autoDetail'; }).value;
                //console.log('applying original settings: ' + JSON.stringify(vueData.settingsUi));
            },
            dismissRefresh() {
                BAWK.play("ui_popupclose");
                extern.applyUiSettings(this.settingsUi, this.originalSettings);
                this.reloadNeeded = false;
            },
            flashSettingsIcons() {
                if (extern?.modSettingEnabled?.("megaMod_sfx") && !this.showSettingsTab) BAWK.play("ui_chicken");
                this.flashTimeouts.forEach(clearTimeout);
                this.flashTimeouts = [];
                document.querySelectorAll(".modsettings-icon").forEach(icon => {
                    icon.classList.remove('icon-alert');
                    // Timeout ms ≈ SFX length
                    this.flashTimeouts.push(setTimeout(() => {
                        icon.classList.add("icon-alert");
                    }, 100));
                    this.flashTimeouts.push(setTimeout(() => {
                        icon.classList.remove("icon-alert");
                    }, 1600));
                });
            },
            openMegaModSettings() {
                if (!this.showSettingsTab) this.showModSettings("megaMod");
            },
            openDiscord() {
                BAWK.play('ui_click');
                open('https://discord.gg/Cxggadazy4');
            },
            modSettingsHover() {
                if (extern?.modSettingEnabled?.("megaMod_sfx_hover")) BAWK.play("settingHover");
            },
            settingsTabHover() {
                if (extern?.modSettingEnabled?.("megaMod_sfx_hover") && !this.showSettingsTab) BAWK.play("settingsTabHover");
            },
            nextPage() {
                if (this.currentPage < this.totalPages) {
                    this.pageDirectionForward = true;
                    this.currentPage++;
                    BAWK.play("ui_onchange");
                }
            },
            prevPage() {
                if (this.currentPage > 1) {
                    this.pageDirectionForward = false;
                    this.currentPage--;
                    BAWK.play("ui_onchange");
                }
            },
            goToPage(page) {
                if (page === this.currentPage) return;
                this.pageDirectionForward = page > this.currentPage;
                this.currentPage = page;
                BAWK.play("ui_click");
            }
        });

        // Chick'n Winner Popup Overlay Dismiss Disabled
        // TODO: Set the chwMiniGameComplete variable instead of overriding it
        const betterUIEnabled = `extern?.modSettingEnabled?.('betterUI_ui')`;
        const chlgUpgrades = `extern?.modSettingEnabled?.('betterUI_chlg')`;
        const chicknWinnerUpgrades = `extern?.modSettingEnabled?.('betterUI_cw')`;
        const chwComplete = "$refs.chickenNugget.isMiniGameComplete";
        const cwInterval = setInterval(() => {
            const chicknWinner = document.getElementById("chicknWinner");
            if (!chicknWinner) return;
            clearInterval(cwInterval);
            chicknWinner.outerHTML = chicknWinner.outerHTML.replace(
                `:overlay-close="chwMiniGameComplete"`, 
                `:overlay-close="${chicknWinnerUpgrades} && ${chwComplete}"`
            ).replace(
                `:hide-close="!chwMiniGameComplete"`, 
                `:hide-close="${chicknWinnerUpgrades} && !${chwComplete}"`
            );
        });

        // Better Inventory
        const invEditsEnabled = `extern?.modSettingEnabled?.('betterUI_inventory')`;
        // Add Random Skin Button, Searchbar Class Edits, Item Amount, and Item Vault UI
        const equipScreen = document.getElementById("equip-screen-template");
        equipScreen.innerHTML = equipScreen.innerHTML.replace(
            `" v-on:keyup="onItemSearchChange" class="ss_field font-nunito box_relative fullwidth">`,
            `" v-on:keyup="onItemSearchChange" class="ss_field font-nunito roundme_lg box_relative" :class="{'limited-input' : (${invEditsEnabled} && isOnEquipModeFeatured), 'fullwidth': !${invEditsEnabled} || (${invEditsEnabled} && isEquipModeInventory && itemVaultEnabled)}">
            <button id="randomize-button" onclick="window.megaMod.betterUI.randomizeSkin()" v-show="${invEditsEnabled} && isEquipModeInventory && !itemVaultEnabled" class="ss_button roundme_lg btn_blue bevel_blue btn-account-w-icon random-button">
                <i class="fas fa-random"></i>
            </button>`
        ).replace(
            `class="item-search-wrap box_relative"`,
            `class="item-search-wrap box_relative" :class="{ 'inventory-skin-search' : (${invEditsEnabled} && isEquipModeInventory && !itemVaultEnabled), 'shop-skin-search' : (${invEditsEnabled} && (isOnEquipModeSkins || isOnEquipModeFeatured || (isEquipModeInventory && itemVaultEnabled))) }"`
        ).replace(
            `{{ loc[equip.categoryLocKey] }}`,
            `{{ loc[equip.categoryLocKey] }} {{ (${invEditsEnabled}) ? ('(' + equip.showingItems.length + '/' + (equip.showingItemTotal || 0) + ')') : '' }}`
        ).replace(
            `onRedeemClick">{{`,
            `onRedeemClick"><i v-show="${invEditsEnabled}" class="fas fa-unlock"></i> {{`
        ).replace(
            `inGame">{{`,
            `inGame"><i v-show="${invEditsEnabled}" class="fas fa-camera"></i> {{`
        ).replace(
            `loc.eq_search_items`,
            `${invEditsEnabled} ? loc.eq_search_items_new : loc.eq_search_items`
        ).replace(
            `<div v-show="isEquipModeInventory`,
            `<div v-show="isEquipModeInventory && ${invEditsEnabled}" class="roundme_lg clickme vaultbtn box_relative f_row align-items-center justify-content-center" :class="{ 'btn_red bevel_red': itemVaultEnabled, 'btn_blue bevel_blue': !itemVaultEnabled, 'disabled': !ui.showHomeEquipUi }" @click="onSwitchToVaultClicked()">
                <i v-if="!itemVaultEnabled" class="fas fa-3x fa-lock text_white"></i>
                <i v-else class="fas fa-3x fa-arrow-left text_white"></i>
            </div> <div v-show="isEquipModeInventory`
        ).replace(
            `:disabled="extern.inGame"`,
            `:disabled="extern.inGame || (${invEditsEnabled} && itemVaultEnabled)"`
        ).replace(
            `<h3 v-if="!showPurchasesUi"`,
            `<h1 v-show="${invEditsEnabled} && isEquipModeInventory && itemVaultEnabled" class="equip-title text-center margins_sm box_relative text_blue5 nospace vault-txt" v-html="loc.megamod_betterUI_itemVault_title"></h1> <h3 v-if="!showPurchasesUi"`
        ).replace(
            `id="equip_panel_right"`,
            `id="equip_panel_right" :class="{ 'vaultopen' : (${invEditsEnabled} && isEquipModeInventory && itemVaultEnabled) }"`
        ).replace(
            `<small-popup id="redeemCodePopup"`,
            `<large-popup id="itemThemePopup" ref="itemThemePopup" hide-confirm="true" :overlay-close="true" class="megamod-popup" :class="equip.theme.class">
                <template slot="content">
                    <h1 v-html="equip.theme.titleTxt"></h1>
                    <p v-html="loc[equip.theme.descLocKey]"></p>
                    <header>
                        <h3 class="text-center text-uppercase" v-html="equip.theme.itemTxt"></h3>
                    </header>
                    <item-grid id="item_grid" :loc="loc" :items="equip.theme.items" :has-buy-btn="false" :selectedItem="null" @item-selected="onItemSelected" :in-inventory="true" :theme-popup="true" :show-tooltips="true"></item-grid>
                    <button v-if="equip.theme.btnLocKey" class="ss_button fullwidth ss_margintop_lg" v-html="loc[equip.theme.btnLocKey]" @click="equip.theme.clickFunc"></button>
                    </template>
            </large-popup><small-popup id="redeemCodePopup"`
        );
        
        /*
        // Item Vault Small Button
        .replace(
            `loc.eq_redeem }}</button>`,
            `loc.eq_redeem }}</button>
            <button v-show="isEquipModeInventory && ${invEditsEnabled}" class="ss_button box_relative fullwidth text-uppercase" :class="{ 'btn_red bevel_red': itemVaultEnabled, 'btn_blue bevel_blue': !itemVaultEnabled }" :disabled="!ui.showHomeEquipUi" @click="onSwitchToVaultClicked()" v-html="itemVaultEnabled ? loc.megamod_betterUI_itemVault_exit : loc.megamod_betterUI_itemVault_enter"></button>
            `
        )
        */
            
        // Item Vault: Hide Shop Button in Item Grid
        const itemGrid = document.getElementById("item-grid-template");
        itemGrid.innerHTML = itemGrid.innerHTML.replace("&& !isSearching", `&& !isSearching && (!${invEditsEnabled} || !itemVaultEnabled) && !themePopup`);
        comp_item_grid.props.push("themePopup");

        Object.assign(vueData.equip, {
            showingItemTotal: 0,
            itemTotals: {},
            theme: {
                titleTxt: "",
                itemTxt: "",
                class: "",
                items: [],
            }
        });
    
        const {
            switchItemType: oldSwitchItemType,
            onChangedClass: oldOnChangedClass,
            onItemSelected: oldOnItemSelected,
            switchTo: oldSwitchTo
        } = comp_equip_screen.methods;
        Object.assign(comp_equip_screen.methods, {
            switchItemType(...args) {
                oldSwitchItemType.apply(this, args);
                if (extern.modSettingEnabled("betterUI_inventory") && this.isEquipModeInventory && this.itemVaultEnabled && this.equip.showingItems.length) {
                    this.updateEquippedItems();
                    this.poseEquippedItems();
                    this.selectItem(this.equip.showingItems[0]);
                }
                this.updateShowingItemTotal();
            },
            onChangedClass(...args) {
                oldOnChangedClass.apply(this, args);
                // Fixes selected item highlight when changing class
                if (extern.modSettingEnabled("betterUI_inventory") && this.equip.showingItems.length) {
                    if (this.showShop && (this.isOnEquipModeFeatured || this.isOnEquipModeSkins)) {
                        this.selectFirstItemInShop();
                    } else if (this.isEquipModeInventory) {
                        if (this.itemVaultEnabled ) {
                            if (this.equip.showingItems.length) this.selectItem(this.equip.showingItems[0])
                        } else {
                            this.selectEquippedItemForType();
                        }
                    } else if (!this.itemVaultEnabled && vueApp.showScreen === vueApp.screens.home) {
                        this.selectEquippedItemForType();
                    }
                }
                this.updateShowingItemTotal();
            },
            // Rewrote this function & fixed pistol not updating in photobooth when switching main weapon class
            poseEquippedItems() {
                const items = { ...this.equipped };
                const { selectedItemType, showingWeaponType, posingStampPositionX, posingStampPositionY } = this.equip;
                
                if (!this.ui.showHomeEquipUi) {
                    Object.keys(items).forEach(key => {
                        key = parseInt(key, 10);
                        const isPrimaryOrSecondary = selectedItemType === ItemType.Primary && key === ItemType.Secondary;
                        const pistolHidden = !vueApp.$refs.photoBooth.egg.items.find(i => i.value === ItemType.Secondary).hidden;
                        
                        // Pistol was getting deleted from the array and wasn't updating as a result
                        if (key !== selectedItemType && !(extern.modSettingEnabled("betterUI_inventory") && isPrimaryOrSecondary && pistolHidden)) delete items[key];
                    });
                } else {
                    const exclusions = {
                        [ItemType.Primary]: [ItemType.Melee, ItemType.Grenade],
                        [ItemType.Secondary]: [ItemType.Melee, ItemType.Grenade],
                        [ItemType.Melee]: [ItemType.Primary, ItemType.Grenade],
                        [ItemType.Grenade]: [ItemType.Secondary, ItemType.Melee]
                    };
            
                    const excludedItems = exclusions[showingWeaponType] || [ItemType.Melee, ItemType.Grenade];
                    excludedItems.forEach(type => items[type] = null);
                }
                extern.poseWithItems(items, posingStampPositionX, posingStampPositionY);
            },
            selectFirstItemInShop() {
                if (this.isInShop && (this.isOnEquipModeFeatured || this.isOnEquipModeSkins) && this.equip.showingItems.length) {
                    this.equip.showingItems[0].ignoreFireSound = extern.modSettingEnabled("betterUI_inventory");
                    this.selectItem(this.equip.showingItems[0]); // Fixes selected premium item playing sound
                }
            },
            // Inventory Item Click SFX
            selectItemClickSound(selectedItem) {
                const legacySfxEnabled = extern?.modSettingEnabled?.("legacyMode_sfx");
                let selectSound;
                if (!selectedItem?.ignoreFireSound && ![ItemType.Hat, ItemType.Stamp].includes(selectedItem.item_type_id) && (selectedItem.unlock !== 'default' || legacySfxEnabled)) {
                    const meshName = selectedItem.item_data.meshName;
                    switch (selectedItem.item_type_id) {
                        case ItemType.Grenade:
                            selectSound = (selectedItem.id === 16000 && extern?.modSettingEnabled("legacyMode_sfx_gexplode")) ? "grenade" : selectedItem.item_data.sound;
                            break;
                        case ItemType.Melee:
                            const premMeleeMeshNames = extern.catalog.melee.filter(item => item.unlock === "premium" || (item.unlock === "purchase" && item.item_data?.tags.includes("Premium"))).map(item => item.item_data.meshName);
                            if (!premMeleeMeshNames.includes(meshName)) break;
                            const sounds = Object.keys(BAWK.sounds).filter(s => s.startsWith(meshName));
                            selectSound = sounds.getRandom();
                            break;
                        default:
                            const weaponClass = meshName.split("_Legacy")[0];
                            selectSound = (legacySfxEnabled && selectedItem.unlock === "default" && extern?.modSettingEnabled(`legacyMode_sfx_${weaponClass.split("_")[1]}_enabled`)) ? `${weaponClass}_fire_Legacy` : `${meshName}_fire`;
                            break;
                    }
                }
                if (eval(invEditsEnabled) && !selectedItem?.ignoreFireSound && BAWK.sounds[selectSound] && [CharClass.Soldier, CharClass.Whipper].includes(selectedItem.exclusive_for_class)) {
                    if (this.fireInterval) clearInterval(this.fireInterval);
    
                    let shotCount = 0;
                    this.fireInterval = setInterval(() => {
                        if (shotCount >= 5) clearInterval(this.fireInterval);
                        BAWK.play(selectSound);
                        shotCount++;
                    }, selectedItem.exclusive_for_class === CharClass.Whipper ? (2 / 0.9 * 30) : (3 / 0.9 * 30)); // rof / 0.9 * 30
                } else {
                    delete selectedItem.ignoreFireSound;
                    BAWK.play(selectSound, '', 'ui_click');
                }
            },
            populateItemGrid (items) {
                if (this.isEquipModeInventory) {
                    if (extern.modSettingEnabled("betterUI_inventory") && this.itemVaultEnabled) {
                        items = items.filter(i => !(extern.isItemOwned(i) || i.unlock === "default" || (i.is_available && ["purchase", "premium", "bundle"].includes(i.unlock))));
                    } else {
                        items = items.filter(i => extern.isItemOwned(i) || (i.is_available && i.unlock === "default"));
                    }
                } else {
                    if (vueApp.showScreen === vueApp.screens.home && this.itemVaultEnabled) {
                        items = items.filter(i => extern.isItemOwned(i) || (i.is_available && i.unlock === "default"));
                    } else {
                        items = items.filter(i => i.is_available && !extern.isItemOwned(i) /*&& !this.store.itemIdsToHide.includes(i.id)*/ && (i.unlock === 'purchase' || (i.unlock === 'premium' && i.sku && i.activeProduct)));
                    }
                }
                
                this.equip.showingItems = items;
            },
            onItemSelected(item) {
                if (extern.modSettingEnabled("betterUI_inventory") && this.isEquipModeInventory && this.itemVaultEnabled) {
                    if (extern.isThemedItem(item, "vip")) vueApp.showSubStorePopup();
                    if (extern.isThemedItem(item, "social")) {
                        const social = this.ui.socialMedia.footer.find(social => social.id === item.id);
                        if (!social) return;
                        open(social.url);
                        extern.socialReward(social.reward);
                        const onVisible = () => {
                            if (document.visibilityState === "visible") {
                                vueApp.$refs.equipScreen.setupItemGridMain();
                                document.removeEventListener("visibilitychange", onVisible);
                            }
                        };
                        document.addEventListener("visibilitychange", onVisible);
                    }
                }
                if(vueApp.$refs.equipScreen.$refs.itemThemePopup.isShowing) {
                    const { item_type_id, exclusive_for_class } = item;
                    const { selectedItemType } = this.equip;

                    const itemOwned = extern.isItemOwned(item) || item.unlock === "default";
                    const vaultItem = !itemOwned && !item.is_available;
                    if (this.itemVaultEnabled !== vaultItem) this.onSwitchToVaultClicked(vaultItem, true);
                    if (itemOwned || vaultItem) {
                        if (item_type_id === ItemType.Primary && this.classIdx !== exclusive_for_class) {
                            extern.changeClass(exclusive_for_class);
                            this.onChangedClass();
                        }
                        if (item_type_id !== selectedItemType) this.switchItemType(item_type_id);
                    }
                }
                oldOnItemSelected.call(this, item);
            },
            onSwitchToVaultClicked(itemVaultEnabled, ignoreSelect=false) {
                this.itemVaultEnabled = itemVaultEnabled ?? !this.itemVaultEnabled;
                this.populateItemGrid(extern.getItemsOfType((this.equip.selectedItemType)));
                
                if (this.itemVaultEnabled) {
                    if (!ignoreSelect && this.equip.showingItems.length) this.selectItem(this.equip.showingItems[0]);
                } else {
                    this.updateEquippedItems();
                    this.poseEquippedItems();
                    this.selectEquippedItemForType();
                }
                vueApp.$refs.equipScreen.renderStamp();
                BAWK.play(this.itemVaultEnabled ? "itemVaultOpen" : "itemVaultClose");
            },
            setupItemTotals() {
                const { inventory, skins, featured } = this.equipMode;

                const isShopItem = i => i.unlock === 'purchase' || (i.unlock === 'premium' && i.sku && i.activeProduct);

                // Featured mode: # of currently purchasable limited items
                this.equip.itemTotals[featured] = extern.getTaggedItems(extern.specialItemsTag).filter(i => isShopItem(i) && i.is_available /*&& !this.store.itemIdsToHide.includes(i.id)*/).length;

                // Pre-filter items once per type to avoid repeating logic
                const itemTypeMap = Object.fromEntries(Object.values(ItemType).map(type => [type, extern.getItemsOfType(type)]));

                // # of owned shop items (eggs + premium) in the weapon category
                const filterShopItems = (items) => items.filter(i => isShopItem(i));
                [inventory, skins].forEach(mode => {
                    const isShopSkins = mode === skins;
                    const totals = {};

                    for (const [type, rawItems] of Object.entries(itemTypeMap)) {
                        const parsedType = +type; // since ItemType keys are numeric
                        if (parsedType === ItemType.Primary) {
                            totals[parsedType] = {};
                            for (const gunClass of Object.values(CharClass)) {
                                const classItems = extern.catalog.primaryWeapons.filter(i => i.exclusive_for_class === gunClass);
                                totals[parsedType][gunClass] = (isShopSkins ? filterShopItems(classItems) : classItems).length;
                            }
                        } else {
                            totals[parsedType] = (isShopSkins ? filterShopItems(rawItems) : rawItems).length;
                        }
                    }

                    this.equip.itemTotals[mode] = totals;
                });
            },
            updateShowingItemTotal() {
                this.equip.showingItemTotal =
                    this.equip.itemTotals[this.currentEquipMode]?.[this.equip.selectedItemType]?.[vueData.classIdx] ??
                    this.equip.itemTotals[this.currentEquipMode]?.[this.equip.selectedItemType] ??
                    this.equip.itemTotals[this.currentEquipMode];
            },
            switchTo(mode, useItemType) {
                oldSwitchTo.call(this, mode, useItemType);
                this.updateShowingItemTotal();
                if (mode === this.equipMode.inventory) {
                    if (extern.modSettingEnabled("betterUI_inventory") && this.itemVaultEnabled && this.equip.showingItems.length) {
                        this.selectItem(this.equip.showingItems[0]);
                    }
                }
            },
            showItemTheme(theme) {
                const { themeData } = unsafeWindow.megaMod.betterUI;
                if (!themeData[theme]) return;

                const data = themeData[theme];
                const themeName = this.loc[data.themeLocKey];
                const items = extern.getThemedItems(theme)/*.filter(item => !this.store.itemIdsToHide.includes(item.id))*/;
                const ownedCount = items.filter(item => item.unlock === "default" || extern.isItemOwned(item)).length;
                this.equip.theme = {
                    ...data,
                    titleTxt: this.loc.p_item_theme_title.format(themeName),
                    itemTxt: this.loc.p_item_theme_items.format(themeName, ownedCount, items.length),
                    class: theme,
                    items
                };
                if (this.equip.theme.clickFunc) {
                    const oldClickFunc = eval(this.equip.theme.clickFunc);
                    this.equip.theme.clickFunc = () => {
                        BAWK.play("ui_click");
                        oldClickFunc()
                    };
                }

                BAWK.play("ui_popupopen");
                this.$refs.itemThemePopup.show();
            }
        });
    
        // Add Item Icons & Price Commas
        const item = document.getElementById("item-template");
        item.innerHTML = item.innerHTML.replace(`<span v-if="isVipItem`,
            `<i v-if="${invEditsEnabled} && typeof showIcon !== 'undefined' && showIcon" :class="typeof iconClass !== 'undefined' ? iconClass :  ''" class="item-icon" @click.stop="iconClick" @mouseenter="iconHover"></i> 
            <span @click.stop="iconClick" @mouseenter="iconHover" v-if="isVipItem`
        ).replace(`itemPrice`, 
            `typeof itemPrice === 'number' ? itemPrice.addSeparators() : itemPrice`
        ).replace(
            `<p v-if="showItemOnly"`,
            `<div v-show="extern?.modSettingEnabled?.('betterUI_inventory') && (typeof showLockIcon !== 'undefined' && showLockIcon)" class="centered">
                <i :class="typeof lockIconClass !== 'undefined' ? lockIconClass :  ''" class="lock-icon"></i>
            </div> <p v-if="showItemOnly"`
        );
        SvgIcon.template = SvgIcon.template.replace(`<svg`, `<svg id="test" @click="$emit('click', $event)" @mouseenter="$emit('mouseenter', $event)`);
        Vue.component('icon', SvgIcon);
    
        // Add Profile Image and Badges
        const profileScreen = document.getElementById("profile-screen-template");
        const badgesEnabled = `extern?.modSettingEnabled?.('betterUI_profile')`;
        const pfpEnabled = `extern?.modSettingEnabled?.('betterUI_profile')`;
        profileScreen.innerHTML = profileScreen.innerHTML.replace(
            `center">\n\t\t\t\t\t<section>`,
            `center">
              <div id="player_photo" v-show="${pfpEnabled}">
                <img :src="photoUrl || '${rawPath}/img/assets/other/pfpDefault.png'" class="roundme_md"/>
              </div><section>`
        ).replace(`s"></p>`, `s"></p>
            <span v-show="${badgesEnabled}" v-for="(row, i) in (badges?.rows.length ? badges.rows : [{ main: [], tier: [] }])">
                <div class="roundme_md profile-badge-container">
                    <span :class="{'info-btn-span': !(row.main.length || row.tier.length) }" v-if="i === 0">
                        <i class="fas fa-info-circle info-btn" @click="vueApp.showBadgeInfo()"></i>
                        <i class="fas fa-grip-lines-vertical badge-separator"></i>
                        <h4 v-if="!(row.main.length + row.tier.length)" v-html="loc.megaMod_betterUI_noBadges"></h4>
                    </span>
                        
                    <span v-if="row.main.length" class="main-badges">
                        <div v-for="badge in row.main || []" class="player-challenge-tool-tip badge">
                            <div class="tool-tip">
                                <i :class="badge.classList" @click="badge.clickFunc"></i>
                                <span class="tool-tip-text" v-html="loc[badge.title] || badge.title"></span>
                            </div>
                        </div>
                    </span>
                    <i v-if="row.main.length && row.tier.length" class="fas fa-grip-lines-vertical badge-separator"></i>
                    <span v-if="row.tier.length" class="tier-badges">
                        <div v-for="badge in row.tier || []" class="player-challenge-tool-tip badge">
                            <div class="tool-tip">
                                <i :class="badge.classList" @click="badge.clickFunc"></i>
                                <span class="tool-tip-text" v-html="loc[badge.title] || badge.title"></span>
                            </div>
                        </div>
                    </span>
                </div>
                <br>
            </span>`
        ).replace(
            `mainLayout"`,
            `mainLayout" :class="{ 'has-badges' : (${badgesEnabled}) }"`
        ).replace("<stats-content", `<stats-content ref="statsContainer"`);
    
    
        CompPlayerChallengeList.methods.showChallengeInfo = MEDIATABS.methods.showChallengeInfo = function() {
            BAWK.play("ui_popupopen");
            vueApp.$refs.challengeInfoPopup.show();
        };

        // Game Code Input Data
        const oldPlayPanelData = comp_play_panel.data;
        comp_play_panel.data = function() {
            return {
                ...oldPlayPanelData.call(this),
                gameCodeValues: new Array(12).fill(""),
                gameCodeEmptyPlaceholders: "TYPEGAMECODE".split(""),
                gameCodeFilledPlaceholders: new Array(12).fill("-"),
                isObserve: parsedUrl?.query?.observe ?? false,
                watchPlayerID: parsedUrl?.query?.watchPlayer ?? "",
            };
        };
        
        const oldOnJoinConfirmed = comp_play_panel.methods.onJoinConfirmed;
        Object.assign(comp_play_panel.methods, {
            showMapPopup() {
                BAWK.play("ui_popupopen");
                vueApp.$refs.mapPopup.show();
            },
            showGameHistoryPopup() {
                if (extern?.modSettingEnabled?.('betterUI_ui')) {
                    BAWK.play("ui_popupopen");
                    vueApp.$refs.gameHistoryPopup.show();
                }
                else if (extern?.modSettingEnabled?.('betterEggforce_banHistory')) this.showBanHistoryPopup();
            },
            sanitizeCode(str) {
                return str.toUpperCase().replace(/[^A-Z]/g, '');
            },
            formatCode(codeArray) {
                return codeArray.join("").replace(/(.{4})(?=.)/g, "$1-");
            },
            applyCode() {
                this.home.joinPrivateGamePopup.code = this.formatCode(this.gameCodeValues);
            },
            onCodeKeydown(index, event) {
                const key = event.key;

                // Allow Ctrl+V / Cmd+V so the browser can trigger the paste event
                if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'v') return;
            
                // Only allow single A–Z letters (case insensitive)
                if (!/^[a-zA-Z]$/.test(key)) {
                    event.preventDefault();
                    return;
                }

                const letter = this.sanitizeCode(key);
                if (!letter) {
                    event.preventDefault();
                    return; // not a valid letter/number, skip
                }

                event.preventDefault(); // only prevent default if we're inserting a valid char
                
                const inputs = this.$refs.codeInputs;
                inputs[index].value = letter;
                this.$set(this.gameCodeValues, index, letter);
                this.applyCode();
                BAWK.play(this.gameCodeValues.every(x => x?.length === 1) ? "ui_equip" :  "ui_onchange");
                
                // Move to the next input if available
                if (index < inputs.length - 1) {
                    const nextInput = inputs[index + 1];
                    if (nextInput.disabled) nextInput.disabled = false;
                    nextInput.focus();
                }
            },
            onCodeBackspace(index, event) {
                event.preventDefault();
                const removeAndShift = (index) => {
                    for (let i = index; i < this.gameCodeValues.length - 1; i++) {
                        this.gameCodeValues[i] = this.gameCodeValues[i + 1];
                    }
                    this.gameCodeValues[this.gameCodeValues.length - 1] = '';
                };

                const input = event.target;
                // If cursor is at start, move to previous and delete its value
                if (input.selectionStart === 0 && index > 0) {
                    removeAndShift(index - 1);
                    this.$refs.codeInputs[index - 1].focus();
                } else {
                    removeAndShift(index);
                }
            
                this.applyCode();
            },
            onCodePaste(index, event) {
                event.preventDefault();
                const pastedTextRaw = event.clipboardData.getData('text');
                const pastedText = pastedTextRaw.toUpperCase();

                const hashIndex = pastedText.indexOf('#');
                const hasHash = hashIndex !== -1;
                if (hasHash && extern?.isEggforcer?.()) {
                    // Parse query parameters if present
                    const url = new URL(pastedTextRaw, window.location.origin);
                    const queryParams = new URLSearchParams(url.search);

                    // Set isObserve if ?observe is present
                    this.isObserve = queryParams.has('observe');

                    // Set watchPlayerID if watchPlayer param is present
                    this.watchPlayerID = queryParams.get('watchPlayer') || "";
                }

                // Extract code from hash or full pasted text
                const result = this.sanitizeCode(hasHash ? pastedText.substring(hashIndex + 1) : pastedText);

                // 4+4+4 Game Code (dashes removed by sanitizeCode())
                if (result.length === 12 && index > 0) index = 0;

                // Fill inputs
                const inputs = this.$refs.codeInputs;
                for (let j = 0; j < result.length && index + j < inputs.length; j++) {
                    const i = index + j;
                    inputs[i].value = result[j];
                    this.$set(this.gameCodeValues, i, result[j]);
                    if (i + 1 < inputs.length) {
                        const nextInput = inputs[i + 1];
                        if (nextInput.disabled) nextInput.disabled = false;
                        nextInput.focus();
                    }
                }
                
                this.applyCode();
                BAWK.play(this.gameCodeValues.every(x => x?.length === 1) ? "ui_equip" :  "ui_onchange");
            },
            onInputClicked(event) {
                if (event.target.disabled) {
                    for(const input of this.$refs.codeInputs) {
                        if (!input.disabled) {
                            input.focus();
                            break;
                        }
                    }
                }
            },
            onJoinConfirmed() {
                const url = new URL(window.location.href);
                const hasObserve = parsedUrl?.query?.observe;
                const watchPlayer = parsedUrl?.query?.watchPlayer;
                const modEnabled = extern?.isEggforcer?.() && extern?.modSettingEnabled?.('betterEggforce_observeToggle');

                if (modEnabled) {
                    const currentWatchPlayer = this.watchPlayerID || watchPlayer;
                    const observeChanged = !extern?.setObserving && this.isObserve !== hasObserve;
                    const watchPlayerChanged = !extern?.setWatchPlayer && this.watchPlayerID !== watchPlayer;
                
                    if (extern?.setObserving) extern.setObserving(this.isObserve);
                    if (extern?.setWatchPlayer) extern.setWatchPlayer(currentWatchPlayer);

                    if (observeChanged || watchPlayerChanged) {
                        const params = [];
                
                        if (this.isObserve) params.push('observe');
                        if (currentWatchPlayer) params.push(`watchPlayer=${encodeURIComponent(currentWatchPlayer)}`);
                
                        url.search = params.length ? `?${params.join('&')}` : '';
                        url.hash = this.home.joinPrivateGamePopup.code;
                
                        window.location.href = url.toString();
                        return;
                    }
                }                
                oldOnJoinConfirmed.call(this);
            },
            showBanHistoryPopup() {
                BAWK.play("ui_popupopen");
                vueApp.onBanSearchChange(true);
                vueApp.onBanSearchChange(false);
                vueApp.$refs.banHistoryPopup.show();
            }
        });

        Object.assign(comp_play_panel.watch, {
            'home.joinPrivateGamePopup.code'(newCode) {
                const clean = this.sanitizeCode(newCode);
                this.gameCodeValues = [...clean].concat(Array(12).fill('')).slice(0, 12);
            }
        });
    
        // Public Map, Game History, and Ban History Buttons, Game Code Update
        const isEggforcer = `[2, 4, 8192].some(role => extern.adminRoles & role)`;
        const playPanel = document.getElementById("play-panel-template");
        const banHistoryEnabled = `extern?.modSettingEnabled?.('betterEggforce_banHistory') && ${isEggforcer}`;
        playPanel.innerHTML = playPanel.innerHTML.replace(
            `ss-button-dropdown>`,
            `ss-button-dropdown><button v-show="${betterUIEnabled}" @click="showMapPopup" class="map_btn ss_button btn_big btn_blue_light bevel_blue_light btn_play_w_friends display-grid align-items-center box_relative"><span v-html="loc.megaMod_betterUI_maps"></span></button>`
        ).replace(
            `<button @click="onJoinPrivateGameClick"`,
            `<button v-show="${banHistoryEnabled} && ${betterUIEnabled}" @click="showBanHistoryPopup" class="banHistory_btn ss_button btn_big btn_blue_light bevel_blue_light btn_play_w_friends display-grid align-items-center box_relative"><span v-html="loc.megaMod_betterEggforce_banHistory"></span></button>
            <button v-show="${betterUIEnabled} || ${banHistoryEnabled}" @click="showGameHistoryPopup" class="gameHistory_btn ss_button btn_big btn_blue bevel_blue btn_play_w_friends display-grid align-items-center box_relative"><span v-html="(${banHistoryEnabled} && !${betterUIEnabled}) ? loc.megaMod_betterEggforce_banHistory_alt : loc.megaMod_betterUI_gameHistory"></span></button><button @click="onJoinPrivateGameClick"`
        ).replace(`sort="order"></ss-button-dropdown>`,
            `sort="order"></ss-button-dropdown>
            <ss-button-dropdown v-show="${betterUIEnabled}" class="play-panel-region-select btn-2 btn_serverselect" :loc="loc" :loc-txt="serverText" :selected-item="currentRegionId" @onListItemClick="onRegionPicked">
                <template slot="dropdown">
                    <li v-if="regionList" v-for="(region, idx) in regionList" :class="{ 'selected' : currentRegionId === region.id }" class="display-grid gap-1 align-items-center text_blue5 font-nunito regions-select" @click="onRegionPicked(region.id)">
                        <div class="f_row align-items-center">
                            <icon v-show="currentRegionId === region.id" name="ico-checkmark" class="option-box-checkmark"></icon>
                        </div>
                        <div>
                            {{ loc[region.locKey ]}}
                        </div>
                        <div class="text-right">
                            {{ region.ping }}ms
                        </div>
                    </li>
                </template>
            </ss-button-dropdown>`
        ).replace(
            `<input type="text"`,
            `<div v-show="${betterUIEnabled}" class="game_code_inputs">
                <template v-for="(input, index) in gameCodeValues.length">
                    <input
                        type="text"
                        :key="index"
                        v-model="gameCodeValues[index]"
                        class="ss_field game_code"
                        :placeholder="(home.joinPrivateGamePopup.code.length ? gameCodeFilledPlaceholders : gameCodeEmptyPlaceholders)[index] || 'X'"
                        maxlength="1"
                        @keydown="onCodeKeydown(index, $event)"
                        @paste="onCodePaste(index, $event)"
                        @keydown.backspace="onCodeBackspace(index, $event)"
                        @click="onInputClicked($event)"
                        ref="codeInputs"
                        :disabled="index > 0 && !gameCodeValues[index - 1]?.length"
                    />
                    <h2 v-if="(index - 3) % 4 === 0 && index < gameCodeValues.length - 1" class="nospace display-inline text_blue4 separator">—</h2>
                </template>
            </div><input type="text" v-show="!${betterUIEnabled}"
            `
        ).replace(
            `<div class="display-grid grid-column-2-1 gap-sm"`,
            `<div class="display-grid grid-column-2-eq" v-show="extern?.isEggforcer?.() && extern?.modSettingEnabled?.('betterEggforce_observeToggle')">
                <label class="ss_checkbox label">{{ loc.p_game_code_observe }}
                    <input type="checkbox" v-model="isObserve" @click="BAWK.play('ui_onchange')">
                    <span class="checkmark"></span>
                </label>
                <div class="display-grid grid-column-auto-1"> 
                    <i class="fas fa-exclamation-triangle watch_icon" :class="{'text_red': this.isObserve, 'text_blue4': !this.isObserve}"></i>
                    <input :placeholder="loc.p_game_code_watchplayer" :disabled="!isObserve" v-model="watchPlayerID" class="ss_field font-nunito box_relative fullwidth">
                </div>
            </div>
            <div class="display-grid gap-sm" :class="{'grid-column-1': ${betterUIEnabled}, 'grid-column-2-1': !${betterUIEnabled}}"`
        ).replace(
            `ss_button_join"`,
            `ss_button_join" :class="{'btn_red bevel_red': (${betterUIEnabled} && (home.joinPrivateGamePopup.code.match(/[A-Za-z]{4}/g)?.length ?? 0) !== 3), 'btn_green bevel_green': (${betterUIEnabled} && (home.joinPrivateGamePopup.code.match(/[A-Za-z]{4}/g)?.length ?? 0) === 3)}"`
        );
        
        Object.assign(vueData, {
            badges: {
                rows: []
            },
            badgeInfo: {
                main: [],
                tier: []
            },
            updateBadges(ignoreNotif = false) {
                MegaMod.log("updateBadges() -", "Updating Badges");
                const CORE_KEY = `${extern.account.id}-coreBadges`;
                const oldCoreBadgeTitles = JSON.parse(localStore.getItem(CORE_KEY));
                const TIER_KEY = `${extern.account.id}-tierBadges`;
                const oldTierBadgeDict = JSON.parse(localStore.getItem(TIER_KEY));

                if (extern.account.id) {
                    const ANON_KEY = "anonAccountId";
                    const anonId = localStore.getItem(ANON_KEY);
                    if (extern.account.isAnonymous && !anonId) {
                        localStore.setItem(ANON_KEY, extern.account.id);
                    } else if (!extern.account.isAnonymous && anonId) {
                        [CORE_KEY, TIER_KEY].forEach(key =>
                            localStore.removeItem(key.replace(extern.account.id, anonId))
                        );
                        localStore.removeItem(ANON_KEY);
                    }
                }

                const newBadges = this.getBadges();
                const newCoreBadges = newBadges.rows.flatMap(row => row.main || []);
                const newCoreBadgeTitles = newCoreBadges.map(badge => badge.title);
                localStore.setItem(CORE_KEY, JSON.stringify(newCoreBadgeTitles));
                
                const getBadgeClass = badge => badge.styleClass.replaceAll(/\btier\d+\b|\bbadge-hover(-alt)?\b/g, '').trim();
                const newTierBadges = newBadges.rows.flatMap(row => row.tier || []);
                const newTierBadgeDict = newTierBadges.reduce((dict, badge) => ((dict[getBadgeClass(badge)] = badge.tier), dict), {});
                localStore.setItem(TIER_KEY, JSON.stringify(newTierBadgeDict));

                if (!ignoreNotif && extern.modSettingEnabled('betterUI_profile')) {
                    const allBadges = this.getBadges(true);
                    const processBadges = (badges, type, filterFn = () => true) => {
                        const removeHover = style => style.replaceAll(/\bbadge-hover(-alt)?\b/g, '').trim();
                        badges.filter(filterFn).forEach(badge => {
                            vueApp.addBadgeMsg({
                                type,
                                badgeClass: removeHover(badge.styleClass),
                                iconClass: removeHover(badge.classList),
                                badgeName: badge.title
                            });
                        });
                    };

                    if (oldCoreBadgeTitles) {
                        processBadges(newCoreBadges, BadgeMsgType.coreGained, badge => !oldCoreBadgeTitles.includes(badge.title));
                        processBadges(allBadges.main.filter(b => oldCoreBadgeTitles.includes(b.title)), BadgeMsgType.coreLost, badge => !newCoreBadgeTitles.includes(badge.title));
                    }

                    if (oldTierBadgeDict) {
                        newTierBadges.forEach(badge => {
                            const oldTier = oldTierBadgeDict[getBadgeClass(badge)];
                            if (oldTier === undefined || badge.tier > oldTier) {
                                processBadges([badge], BadgeMsgType.tierUpgrade);
                            } else if (badge.tier < oldTier) {
                                processBadges([badge], BadgeMsgType.tierDowngrade);
                            }
                        });
    
                        const lostTierBadges = Object.keys(oldTierBadgeDict).filter(badgeClass => !(badgeClass in newTierBadgeDict));
                        lostTierBadges.forEach(badgeClass => {
                            const lostBadge = allBadges.tier.find(b => badgeClass === getBadgeClass(b) && b.tier === oldTierBadgeDict[badgeClass]);
                            if (lostBadge) processBadges([lostBadge], BadgeMsgType.tierLost);
                        });
                    }
                }

                // Update the current badges
                this.badges = newBadges;
            },
            badgeMsg: {
                showing: false,
                msgs: [],
                titleLocKey: '',
                badgeClass: '',
                iconClass: '',
                badgeName: ''
            },
            getChallengeClaims(id) {
                return extern?.account?.challengesClaimed?.filter(val => val == id)?.length;
            }, 
            gameHistory: [],
            disableModsPopupContent: "",
            modErrsPopupContent: "",
            modUpdatePopupContent: "",
            modUpdatedPopupContent: "",
            updateContent: { updateInfo: [], currentChangelog: {}},
            modAnnouncement: "",
            openMegaModUpdate() {
                BAWK.play("ui_click");
                unsafeWindow.openUpdate();
            },
            openGameCode(code, isOpen) {
                if (!isOpen) {
                    BAWK.play("ui_reset");
                    return;
                }
                [vueApp.$refs.gameHistoryPopup, vueApp.$refs.banHistoryPopup].forEach(popup => {
                    if (popup.isShowing) popup.close();
                });
                BAWK.play("ui_popupopen");
                vueApp.showJoinPrivateGamePopup(code);
            },
            currencyCode: "USD",
            itemThemeMap: {},
            getMapSizeIcon(size) {
                if (size <= 13) {
                    return 'ico-map-size-small';
                } else if (size >= 14 && size <= 17) {
                    return 'ico-map-size-med';
                } else if (size > 17) {
                    return 'ico-map-size-large';
                }
            },
            itemVaultEnabled: false,
            chwBarVisible: true,
            banReasons: [],
            chatMsgs: [],
            banHistory: [],
            playerBanHistory: [],
            showingBanHistory: [],
            showingPlayerBanHistory: [],
            banHistorySearch: "",
            playerBanHistorySearch: "",
            selectedBanIndex: 0,
            selectedUniqueID: "",
            getBanDuration(val) {
                return this.banDurations.find(duration => duration.value == val).label;
            },
            getBanDate(date) {
                return new Date(date).toLocaleString();
            },
            onBanSelect(index, uniqueID) {
                this.selectedBanIndex = index;
                this.selectedUniqueID = uniqueID;

                this.updatePlayerBanHistory();
            },
            selectFirstBan() {
                if (this.showingBanHistory.length) this.onBanSelect(0, this.showingBanHistory.toReversed()[0].player.uniqueId);
            },
            updatePlayerBanHistory() {
                this.playerBanHistory = this.banHistory.filter(ban => ban.player.uniqueId === this.selectedUniqueID);
                this.onBanSearchChange(false);
            },
            onBanSearchChange(mainBanArr) {
                const filterFn = (ban) => {
                    const parts = [
                        this.getBanDuration(ban.ban.duration),
                        ban.ban.reason,
                        this.getBanDate(ban.date),
                        ban.gameCode,
                        ban.player.name,
                        ban.player.uniqueId,
                        ban.map.name,
                        ban.map.filename,
                        this.loc[ban.serverLoc],
                        this.loc[ban.modeLoc],
                        ban.isPrivate ? this.loc.stat_private : this.loc.stat_public
                    ];
                    return parts.join(' ').toLowerCase().includes(mainBanArr ? this.banHistorySearch.toLowerCase() : this.playerBanHistorySearch.toLowerCase());
                };

                const source = mainBanArr ? this.banHistory : this.playerBanHistory;
                const targetProp = mainBanArr ? 'showingBanHistory' : 'showingPlayerBanHistory';
                this[targetProp] = source.filter(filterFn);
                if (mainBanArr) this.selectFirstBan();
            },
            leaveToJoinGame: false,
            leaveToJoinGameCode: "",
            onLeaveGameConfirmedJoinGame() {
                vueApp.leaveToJoinGame = true;
                vueApp.onLeaveGameConfirm();
            },
            onLeaveGameResetJoinGame() {
                vueApp.leaveToJoinGame = false;
            },
            handleGameCodeClick(event, code) {
                event.stopPropagation();
                if (code.toLowerCase() === this.game.shareLinkPopup.code.toLowerCase()) {
                    BAWK.play("ui_reset");
                    vueApp.$refs.gameScreen.showInGameNotif('leave_game_to_join_other_error');
                } else {
                    vueApp.leaveGameToJoinOther(code);
                }
            },
            leaveGameToJoinOther(code) {
                vueApp.leaveToJoinGameCode = code;
                BAWK.play("ui_popupopen");
                vueApp.$refs.leaveGameWarningPopup.show();
            }
        });
    
        // Adjust size of stats container for badges
        const stats = document.getElementById("stats-stats-template");
        stats.innerHTML = stats.innerHTML.replace(
            `class="stats-container`,
            `:class="{ [statsClassName] : ${badgesEnabled}, 'stats-container-pfp' : ${pfpEnabled} }" class="stats-container`
        );
    
        STATSPOPUP.computed.statsClassName = function() {
            return `shorter-stats-container-${vueData.badges.rows.length}`;
        };
        
        // VIP Color Slider
        const sliderUnlocked = `extern?.modSettingEnabled?.('colorSlider_unlock')`;
        const colorSelect = document.getElementById("color-select-template");
        colorSelect.innerHTML = colorSelect.innerHTML.replace(`</div>\n\t</div>\n`,
            `</div>
          <div id="color-picker" v-show="extern?.modSettingEnabled?.('colorSlider')" class="color-slider">
            <div class="slider-locks" v-show="!(${sliderUnlocked} || isUpgrade)">
                <i @click="sliderClick" class="slider-saturation-lock fas fa-lock"></i>
                <i @click="sliderClick" class="slider-hue-lock fas fa-lock"></i>
                <i @click="sliderClick" class="slider-brightness-lock fas fa-lock"></i>
            </div>
            <input id="colorSlider_saturation" type="range" :disabled="!${sliderUnlocked} && !vueApp.isUpgraded" @input="updateSaturation" click="sliderClick" @change="sliderChange" v-model="saturationSliderVal" :value="saturationSliderVal" min="0" max="100" step="0.00001">
            <input id="colorSlider_hue" type="range" :disabled="!${sliderUnlocked} && !vueApp.isUpgraded" @input="updateHue" click="sliderClick" @change="sliderChange" v-model="hueSliderVal" :value="hueSliderVal" min="0" max="100" step="0.00001">
             <input id="colorSlider_brightness" type="range" :disabled="!${sliderUnlocked} && !vueApp.isUpgraded" @input="updateBrightness" click="sliderClick" @change="sliderChange" v-model="brightnessSliderVal" :value="brightnessSliderVal" min="0" max="100" step="0.00001">
          </div>
        </div>`).replace(
                `<span v-for="(c, index) in paidColors`,
                `<button class="ss_button roundme_lg btn_blue bevel_blue btn-account-w-icon" @click="randomizeColor" v-show="extern?.modSettingEnabled?.('colorSlider_randomizer', true)"><i class="fas fa-random"></i></button> <span v-for="(c, index) in paidColors`);
    
        const oldColorSelectData = comp_color_select.data;
        Object.assign(comp_color_select, {
            data() {
                return {
                    ...oldColorSelectData.call(this),
                    hueSliderVal: 50,
                    saturationSliderVal: 100,
                    brightnessSliderVal: 50,
                    sliderDisabled: true
                };
            },
            mounted() {
                this.sliderDisabled = !(this.isUpgrade || extern?.modSettingEnabled?.("colorSlider_unlock"));
                this.setSavedColor();
                if (extern?.usingSlider?.() && extern.account.colorIdx === 14 && extern?.modSettingEnabled?.("colorSlider_autoSave")) this.updateColor();
            }
        });
    
        Object.assign(comp_color_select.methods, {
            hueToHex: (hue, saturation, brightness) => {
                const h = hue / 360;
                const s = saturation / 100;
                const l = brightness / 100;
    
                const hueToRGB = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
    
                let r, g, b;
                if (s === 0) {
                    r = g = b = l;
                } else {
                    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                    const p = 2 * l - q;
                    r = hueToRGB(p, q, h + 1 / 3);
                    g = hueToRGB(p, q, h);
                    b = hueToRGB(p, q, h - 1 / 3);
                }
    
                return `#${((1 << 24) + (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255)).toString(16).slice(1)}`;
            },
            updateHue(setColor) {
                const hue = this.hueSliderVal * 3.6;
                this.updateGradient('--saturationSlider-gradient', hue, null, this.brightnessSliderVal);
                this.updateGradient('--brightnessSlider-gradient', hue, this.saturationSliderVal, null);
                this.setCustomColor(setColor);
    
                // Update Lock
                const huePos = 6.13 + ((this.hueSliderVal / 100) * (22.44 - 6.13));
                document.documentElement.style.setProperty('--hueSlider-lock-pos', `${huePos}em`);
            },
            updateSaturation(setColor) {
                const saturation = this.saturationSliderVal;
                const brightness = this.brightnessSliderVal;
                this.updateGradient('--hueSlider-gradient', null, saturation, brightness);
                this.updateGradient('--brightnessSlider-gradient', this.hueSliderVal * 3.6, saturation, null);
                this.setCustomColor(setColor);
    
                const saturationPos = 0.85 + ((saturation / 100) * (4.75 - 0.85));
                document.documentElement.style.setProperty('--saturationSlider-lock-pos', `${saturationPos}em`);
            },
            updateBrightness(setColor) {
                const brightness = this.brightnessSliderVal;
                this.updateGradient('--saturationSlider-gradient', this.hueSliderVal * 3.6, null, brightness);
                this.updateGradient('--hueSlider-gradient', null, this.saturationSliderVal, brightness);
                this.setCustomColor(setColor);
    
                const brightnessPos = 23.87 + ((brightness / 100) * (27.73 - 23.87));
                document.documentElement.style.setProperty('--brightnessSlider-lock-pos', `${brightnessPos}em`);
                document.documentElement.style.setProperty('--slider-lock-brightness', `${(brightness <= 75) ? 100 : 0}%`); // OLD --> (100 - brightness)
            },
            updateColor(setColor) {
                this.updateHue(setColor);
                this.updateSaturation(setColor);
                this.updateBrightness(setColor);
            },
            updateGradient(property, hue, saturation, brightness) {
                const hueMod = hue === null;
                const satMod = saturation === null;
                const briMod = brightness === null;
                const maxVal = (hueMod) ? 80 : 100;
    
                let steps = '';
                for (let i = 0; i <= maxVal; i += 10) {
                    steps += `hsl(${hueMod ? (i * 4.5) : hue}, ${(satMod) ? i : saturation}%, ${(briMod) ? i : brightness}%)`;
                    steps += (i !== maxVal) ? ", " : "";
                }
                document.documentElement.style.setProperty(property, `linear-gradient(90deg, ${steps})`);
            },
            setCustomColor(setColor) {
                const hue = this.hueSliderVal * 3.6;
                const saturation = this.saturationSliderVal;
                const brightness = this.brightnessSliderVal;
    
                document.documentElement.style.setProperty('--slider-selected-color', `hsl(${hue}, ${saturation}%, ${brightness}%)`);
                if (setColor) extern.setSliderColor(this.hueToHex(hue, saturation, brightness));
            },
            sliderClick() {
                if (this.sliderDisabled) {
                    vueApp.showSubStorePopup();
                    return;
                }
                this.updateColor();
                BAWK.play('ui_onchange');
            },
            sliderChange() {
                BAWK.play('ui_onchange');
                const hueVal = this.hueSliderVal;
                const satVal = this.saturationSliderVal;
                const briVal = this.brightnessSliderVal;
                localStore.setItem('colorSlider_h', hueVal);
                localStore.setItem('colorSlider_s', satVal);
                localStore.setItem('colorSlider_l', briVal);
                localStore.setItem('colorSlider_hex', this.hueToHex(hueVal * 3.6, satVal, briVal));
            },
            setSavedColor() {
                const hueVal = localStore.getNumItem("colorSlider_h");
                const satVal = localStore.getNumItem("colorSlider_s");
                const briVal = localStore.getNumItem("colorSlider_l");
                if (hueVal != null) this.hueSliderVal = hueVal;
                if (satVal != null) this.saturationSliderVal = satVal;
                if (briVal != null) this.brightnessSliderVal = briVal;
                this.updateColor(false);
            },
            randomizeColor() {
                if (Math.random() < 0.5 || this.sliderDisabled || !extern?.modSettingEnabled?.("colorSlider")) {
                    extern.setShellColor(Math.randomInt(0, this.isUpgrade ? 14 : 7));
                } else {
                    Object.assign(this, {
                        hueSliderVal: Math.randomInt(0, 101),
                        saturationSliderVal: Math.randomInt(0, 101),
                        brightnessSliderVal: Math.randomInt(0, 101)
                    });
                    this.updateColor(true);
                }
                BAWK.play('ui_onchange');
            }
        });
        
        // BUGGED!!!
        // Killstreak Info & First-Person Spec
        const timerEnabled = `extern?.modSettingEnabled?.('killstreakInfo_timer')`;
        const inFirstPerson = `!ui.game.spectatingPlayerName || game.isPaused`;
        const crosshairDot = `${inFirstPerson} && !extern?.modSettingEnabled?.('specTweaks_crosshair_dot')`;
        const crosshairMain = `${inFirstPerson} && !extern?.modSettingEnabled?.('specTweaks_crosshair_main')`;
        const updownKeybinds = `extern?.modSettingEnabled?.('specTweaks_updown')`;
        const eggforceBan = `extern?.modSettingEnabled?.('betterEggforce_banPopup')`;
        const uniqueIdElem = `<p v-show="${eggforceBan} && ${isEggforcer}" @click="copyPlayerDetails" class="text_blue5 playeraction_details">{{ loc.ui_game_playeractions_uniqueid }} {{ playerActionsPopup?.uniqueId ?? '?' }} <i class="fas6 fa-copy"></i></p>`;
        const gameScreen = document.getElementById("game-screen-template");
        gameScreen.innerHTML = gameScreen.innerHTML.replace(
            `uts">`,
            `uts">
             <h5 v-show="${timerEnabled} && !game.isPaused" class="nospace title">TIME</h5>
             <p v-show="${timerEnabled} && !game.isPaused" id="playTimer" class="name">0:00.000</p>`
        ).replace(
            `!ui.game.spectate`, `(!game.isPaused && !ui.game.spectate) || (!game.isPaused && ui.game.spectatingPlayerName && extern?.modSettingEnabled?.('specTweaks_health'))`
        ).replace(
            `reticleDot"`, `reticleDot" v-show="${crosshairDot}"`
        ).replace(
            `redDotReticle"`, `redDotReticle" v-show="${crosshairDot}"`
        ).replace(
            `crosshairContainer"`, `crosshairContainer" v-show="${crosshairMain}"`
        ).replace(
            `shotReticleContainer"`, `shotReticleContainer" v-show="${crosshairMain}"`
        ).replace(
            `readyBrackets"`, `readyBrackets" v-show="${crosshairMain}"`
        ).replace(
            `<span class="fas fa-arrow-up"></span>`,
            `<span v-show="!(${updownKeybinds})" class="fas fa-arrow-up"></span>{{ upSpectateTxt }}`
        ).replace(
            `<span class="fas fa-arrow-down"></span>`,
            `<span v-show="!(${updownKeybinds})" class="fas fa-arrow-down"></span>{{ downSpectateTxt }}`
        ).replace(
            `&nbsp;{{ loc.ui_game_spectate_select`,
            `{{ loc.ui_game_spectate_select`
        ).replace(
            `div>{{ spectateControls }}`, `div v-html="spectateControlTxt">`
        ).replace(
            `<span class="text_yellow"`,
            `<i v-show="extern?.modSettingEnabled?.('betterChat_chatIcons')" class="fas6 fa-bullhorn hidden text_yellow ss_marginright_xs"></i><span class="text_yellow"`
        ).replace(
            `<small-popup id="playerActionsPopup"`,
            `<small-popup id="playerActionsPopup"`
        ).replace(
            `<div id="respawn-menu">`,
            `<div id="respawn-menu" class="display-grid align-items-center gap-sm">
            <div v-show="!isPoki && firebaseId && ${chicknWinnerUpgrades} && chwBarVisible" id="chw-progress-wrapper" class="box_relative">
                <!-- incentivized-mini-game -->
                <img class="box_aboslute chw-progress-img chw-chick" :src="chwChickSrc">
                <div class="chw-progress-bar-wrap roundme_sm box_relative btn_blue bevel_blue" :class="progressBarWrapClass" @click="playIncentivizedAd">
                    <p class="chw-progress-bar-msg box_aboslute centered nospace text-center fullwidth chw-msg chw-p-msg">
                        {{ progressMsg }}
                        <span v-show="chw.hours || chw.minutes || chw.seconds" class="chw-countdown-wrap" :class="chwShowCountdown">
                           <span v-show="chw.hours" class="chw-hours">{{chw.hours}}:</span><span class="chw-minutes">{{chw.minutes}}:</span><span class="chw-seconds">{{chw.seconds}}</span>
                           <span v-show="!chw.ready && chw.limitReached && !chw.adBlockDetect" v-html="wakeTheChw"></span>
                        </span>
                    </p>
                    <div class="chw-progress-bar-inner-popup bg_blue2" :style="{width: chw.progress + '%'}"></div>
                </div>
                <!-- <img class="box_aboslute chw-eggs chw-progress-img" src="img/egg_pack_small.webp" alt=""> -->
            </div>`
        ).replace(
            `<div id="cts-message" `,
            `<div id="ingame-notif" class="in-game-notification centered_x" v-show="inGameNotifShowing"><h2 class="nospace text_white">{{ inGameNotifMsg }}</h2></div><div id="cts-message" `
        ).replace(
            `ref="banPlayerPopup"`,
            `ref="banPlayerPopup" :class="{ 'wider' : ${eggforceBan} }"`
        ).replace(
            `</select>`,
            `</select>
            <div v-show="${eggforceBan}"> 
                <h4 class="text_blue5 ss_marginbottom_sm">{{ loc.ui_game_playeractions_chat_message }}</h4>
                <label class="ss_checkbox label fullwidth" :class="{ 'ss_marginbottom_xl' : !banPlayerPopup.sendChatMsg }">{{ loc.ui_game_playeractions_chat_message_send }}
                    <input type="checkbox" v-model="banPlayerPopup.sendChatMsg" @click="BAWK.play('ui_onchange')">
                    <span class="checkmark"></span>
                </label>
                <div class="fullwidth" v-show="banPlayerPopup.sendChatMsg">
                    <select ref="chatMsgSelect" v-model="banPlayerPopup.selectedChatMsg" @change="updateChatMessage" class="ss_field fullwidth ss_margintop">
                        <option v-for="msg in chatMsgs" v-bind:value="msg.value" v-html="loc[msg.locKey]"></option>
                    </select>
                    <input :disabled="banPlayerPopup.selectedChatMsg !== 0" type="text" ref="chatMsg" v-model="banPlayerPopup.customChatMsg" :placeholder="loc.ui_game_playeractions_chat_message_placeholder" class="ss_field ss_margintop ss_marginbottom fullwidth">
                    <div class="display-grid grid-column-2-eq ss_marginbottom_xl fullwidth">
                        <label class="ss_checkbox label">{{ loc.ui_game_playeractions_chat_censor }}
                            <input type="checkbox" v-model="banPlayerPopup.censorName" @click="BAWK.play('ui_onchange')" @change="updateChatMessage">
                            <span class="checkmark"></span>
                        </label>
                        <label class="ss_checkbox label">{{ loc.ui_game_playeractions_chat_thanks }}
                            <input type="checkbox" v-model="banPlayerPopup.sendThanksMsg" @click="BAWK.play('ui_onchange')">
                            <span class="checkmark"></span>
                        </label>
                    </div>
                </div>
            </div>
            `
        ).replace(
            `<input ref="banReason"`,
            `<h4 class="text_blue5 ss_marginbottom_sm" v-show="${eggforceBan}">{{ loc.ui_game_playeractions_ban_reason }}</h4>
            <select ref="banReasonSelect" v-model="banPlayerPopup.selectedBanReason" v-show="${eggforceBan}" @change="updateChatMessage" class="ss_field fullwidth">
                <option v-for="reason in banReasons" v-bind:value="reason.value" v-html="loc[reason.locKey]"></option>
            </select>
            <input v-show="banPlayerPopup.selectedBanReason === 0" :class="{ 'fullwidth' : ${eggforceBan} }" ref="banReason" @keyup="updateChatMessage"`
        ).replace(
            `<select ref="banDuration"`,
            `<h4 class="text_blue5 ss_marginbottom_sm" v-show="${eggforceBan}">{{ loc.ui_game_playeractions_ban_duration }}</h4><select :class="{ 'fullwidth' : ${eggforceBan} }" ref="banDuration"`
        ).replaceAll(
            `>{{ playerActionsPopup.playerName }}</h5>`,
            `:class="{ 'ss_marginbottom_sm' : (${eggforceBan} && ${isEggforcer}) }">{{ playerActionsPopup.playerName }}</h5>
            ${uniqueIdElem}`
        ).replaceAll(
            `<div v-if="playerActionsPopup.vipMember"`,
            `${uniqueIdElem}<div v-if="playerActionsPopup.vipMember"`
        );
        // Better Ban Popup
        Object.assign(vueData.banPlayerPopup, {
            selectedBanReason: 3,
            sendChatMsg: false,
            selectedChatMsg: 1,
            customChatMsg: "",
            censorName: false,
            sendThanksMsg: true
        });

        const oldGameScreenData = comp_game_screen.data;
        Object.assign(comp_game_screen, {
            data() { 
                // Don't use return {...oldGameScreenData.call(this)} cuz it breaks game screen
                const data = oldGameScreenData.call(this);
                Object.assign(data, {
                    upSpectateTxt: "",
                    downSpectateTxt: "",
                    spectateControlTxt: "",
                    inGameNotifShowing: false,
                    inGameNotifMsg: "",
                    inGameNotifTimeout: null
                });
                return data;
            },
            mounted() {
                this.updateSpectateControls();
            }
        });

        const oldBanActionClicked = comp_game_screen.methods.onBanActionClicked
        Object.assign(comp_game_screen.methods, {
            updateSpectateControls() {
                const specEnabled = extern?.modSettingEnabled?.("specTweaks");
                const specControls = this.settingsUi.controls.keyboard.spectate;
                this.upSpectateTxt = extern?.modSettingEnabled?.("specTweaks_updown") ? specControls.find(i => i.id === "ascend").value : '';
                this.downSpectateTxt = extern?.modSettingEnabled?.("specTweaks_updown") ? specControls.find(i => i.id === "descend").value : '';
                if (specEnabled) this.downSpectateTxt += " :";
    
                const freecamKey = this.settingsUi.controls.keyboard.spectate.find(item => item.id === "toggle_freecam")?.value;
                let controlTxt = this.loc[specEnabled ? 'ui_game_spectate_controls_exit' : 'ui_game_spectate_controls'].format(freecamKey);
    
                const addModSettingKey = (mod, keyId, locKey) => {
                    const key = unsafeWindow?.megaMod?.getModSettingById?.(keyId)?.value;
                    if (extern?.modSettingEnabled?.(mod)) controlTxt += this.loc[locKey].format(key);
                };
                addModSettingKey("hideHUD", "hideHUD_keybind", 'ui_game_spectate_controls_hud');
                addModSettingKey("specTweaks", "specTweaks_freezeKeybind", 'ui_game_spectate_controls_freeze');
                if(extern?.isEggforcer?.()) addModSettingKey("betterEggforce_specESP", "betterEggforce_specESP_keybind", 'ui_game_spectate_controls_esp');
    
    
                this.spectateControlTxt = controlTxt;
            },
            showInGameNotif(locKey) {
                if (!extern.modSettingEnabled("megaMod_inGameAlerts")) return;
                this.inGameNotifMsg = this.loc[locKey] || locKey;
                this.inGameNotifShowing = true;
                if (this.inGameNotifTimeout) clearTimeout(this.inGameNotifTimeout);
                this.inGameNotifTimeout = setTimeout(() => {
                    this.inGameNotifShowing = false;
                }, 1000);
            },
            onBanClicked () {
                this.addBanToHistory();
                this.$refs.banPlayerPopup.hide();

                const modEnabled = extern?.modSettingEnabled?.('betterEggforce_banPopup');
                const banReason = modEnabled ? this.getBanReason() : this.$refs.banReason.value;   
                this.playerActionsPopup.banFunc(banReason, this.$refs.banDuration.value);
                if (modEnabled && this.banPlayerPopup.sendChatMsg) {
                    if (this.banPlayerPopup.sendChatMsg) MegaMod.sendChatMessage(this.banPlayerPopup.customChatMsg);
                    if (this.banPlayerPopup.sendThanksMsg) MegaMod.sendChatMessage(this.loc.ui_game_playeractions_chat_thanksmsg);
                }
            },
            getPlayerName() {
                return this.banPlayerPopup.censorName ? this.loc.ui_game_playeractions_chat_generic_name : this.playerActionsPopup.playerName;
            },
            getBanReason() {
                const selectedReason = this.loc[this.banReasons.find(reason => reason.value === this.banPlayerPopup.selectedBanReason).locKey ?? 'ui_game_playeractions_reason_default'];
                return this.banPlayerPopup.selectedBanReason === 0 ? this.$refs.banReason.value : selectedReason;
            },
            getChatMessage() {
                const { selectedChatMsg, customChatMsg } = this.banPlayerPopup;
                if (selectedChatMsg === 0) return customChatMsg;
            
                if ([1, 2].includes(selectedChatMsg)) {
                    const template = this.loc[selectedChatMsg === 1 ? 'ui_game_playeractions_chat_template_specific' : 'ui_game_playeractions_chat_template_generic'];
                    return template.format(this.getPlayerName(), this.getBanReason());
                }
            
                const selected = this.chatMsgs.find(msg => msg.value === selectedChatMsg);
                return this.loc[selected.locKey];
            },
            updateChatMessage() {
                if (this.banPlayerPopup.selectedChatMsg == 0) return;
                this.banPlayerPopup.customChatMsg = this.getChatMessage();
            },
            onBanActionClicked() {
                this.updateChatMessage();
                oldBanActionClicked.call(this);
            },
            copyPlayerDetails() {
                if (!extern?.modSettingEnabled?.('betterEggforce_banPopup')) return;
                this.showInGameNotif('megaMod_betterEggforce_copied');
                const { playerName, uniqueId } = this.playerActionsPopup;
                navigator.clipboard.writeText(`${playerName} (${uniqueId})`);
            },
            addBan(name, uniqueId, duration, reason) {
                const gameCode = this.game.shareLinkPopup.code.toUpperCase();
                if (!gameCode) return;

                const { mapName, gameType } = this.game;
                const banData = {
                    date: new Date().toJSON(),
                    player: { name, uniqueId },
                    ban: { duration, reason },
                    map: { name: mapName },
                    modeLoc: this.gameTypes.find(type => type.value === gameType).locKey,
                    serverLoc: `server_${this.currentRegionId}`,
                    gameCode: gameCode,
                    isPrivate: extern.isPrivateGame,
                    isOpen: true
                };
                banData.map.filename = this.maps.find(map => map.name === banData.map.name).filename;
                this.banHistory.push(banData);
                if (unsafeWindow.megaMod?.betterEggforce) unsafeWindow.megaMod.betterEggforce.checkBanHistory();
            },
            addBanToHistory() {
                const { playerName, uniqueId } = this.playerActionsPopup;
                const banReason = extern?.modSettingEnabled?.('betterEggforce_banPopup') ? this.getBanReason() : this.$refs.banReason.value;
                this.addBan(playerName, uniqueId, this.$refs.banDuration.value, banReason);
            }
        });

        // Photobooth Egg Spin
        const photoBooth = document.getElementById("photoBooth-screen-template");
        photoBooth.innerHTML = photoBooth.innerHTML.replace(
            `loc.screen_photo_booth_screenshot }}</button>`,
            `loc.screen_photo_booth_screenshot }}</button>
        <div v-show="extern?.modSettingEnabled?.('pbSpin')">
            <section id="photoBooth-fps" class="ss_marginbottom ss_margintop">
                <ss-button-dropdown class="btn-1 fullwidth" :loc="loc" :loc-txt="fpsTxt" :list-items="egg.fpsAmounts" :selected-item="fps" menuPos="right" @onListItemClick="onChangeFPS" :loc-list="true"></ss-button-dropdown>
            </section>
            <section id="photoBooth-spin-speed" class="ss_marginbottom ss_margintop">
                <ss-button-dropdown class="btn-1 fullwidth" :loc="loc" :loc-txt="spinSpeedTxt" :list-items="egg.spinSpeeds" :selected-item="spinSpeed" menuPos="right" @onListItemClick="onChangeSpinSpeed" :loc-list="true"></ss-button-dropdown>
            </section>
            <button class="ss_button btn_yolk bevel_yolk box_relative fullwidth text-uppercase" @click="spinEgg(false)"><i class="fas fa-sync-alt"></i> {{ loc.screen_photo_booth_spin }}</button>
            <button disabled class="ss_button btn_yolk bevel_yolk box_relative fullwidth text-uppercase" @click="spinEgg(true)"><i class="fas fa-file-video"></i> {{ loc.screen_photo_booth_gif }}</button>
        </div>
        `);
    
        const oldPhotoBoothData = CompPhotoboothUi.data;
        CompPhotoboothUi.data = function() {
            const data = oldPhotoBoothData.call(this);
            Object.assign(data.egg, {
                fpsAmounts: [
                    { id: 'egg-fps-low', name: 'screen_photo_booth_fps_low', value: 0, fps: 15 },
                    { id: 'egg-fps-med', name: 'screen_photo_booth_fps_med', value: 1, fps: 30 },
                    { id: 'egg-fps-high', name: 'screen_photo_booth_fps_high', value: 2, fps: 60 }
                ],
                spinSpeeds: [
                    { id: 'egg-speed-slow', name: 'screen_photo_booth_speed_slow', value: 0, time: 2000 },
                    { id: 'egg-speed-normal', name: 'screen_photo_booth_speed_normal', value: 1, time: 1000 },
                    { id: 'egg-speed-fast', name: 'screen_photo_booth_speed_fast', value: 2, time: 500 }
                ],
            });
            return {
                ...data,
                fps: 1,
                spinSpeed: 1
            };
        };
    
        Object.assign(CompPhotoboothUi.methods, {
            spinEgg(gif) {
                const time = this.egg.spinSpeeds[this.spinSpeed].time;
                const fps = this.egg.fpsAmounts[this.fps].fps;
                extern?.spinEgg?.(time, Math.ceil(time * fps / 1000), gif && unsafeWindow.megaMod.photoboothEggSpin.captureFrame);
            },
            onChangeFPS(fps) {
                if (fps === this.fps) return;
                this.fps = fps;
                BAWK.play('ui_click');
            },
            onChangeSpinSpeed(speed) {
                if (speed === this.spinSpeed) return;
                this.spinSpeed = speed;
                BAWK.play('ui_click');
            }
        });
        Object.assign(CompPhotoboothUi.computed, {
            fpsTxt() {
                return {
                    title: this.loc.screen_photo_booth_fps_title || "Spinning GIF FPS",
                    subTitle: this.loc[this.egg.fpsAmounts[this.fps].name] || "Medium (30 FPS)"
                };
            },
            spinSpeedTxt() {
                return {
                    title: this.loc.screen_photo_booth_speed_title || "Spin Speed",
                    subTitle: this.loc[this.egg.spinSpeeds[this.spinSpeed].name] || "Normal"
                };
            }
        });
    
        // Custom Changelog
        Object.assign(comp_footer_links_panel.methods, {
            onChangelogClicked (megaMod = false) {
                vueApp.showChangelogPopup(megaMod);
                BAWK.play('ui_popupopen');
            },
            onServerClicked() {
                vueApp.$refs.settings.openDiscord();
            }
        });
    
        const changelog = document.getElementById("changelogPopup");
        const megaModChangelog = "changelog.isMegaMod || false";
        changelog.innerHTML = changelog.innerHTML.replace(
            `{{ loc.changelog_title }}`,
            ``
        ).replace(
            `id="popup_title nospace"`,
            `id="popup_title nospace" v-html="(${megaModChangelog}) ? loc.megaMod_changelog_title : loc.changelog_title"`
        ).replace(
            `changelog.current`,
            `(${megaModChangelog}) ? changelog.megaMod.current : changelog.current`
        ).replace(
            `changelog.showHistoryBtn`,
            `(${megaModChangelog}) ? changelog.showMegaModHistoryBtn : changelog.showHistoryBtn`
        ).replace(
            "showHistoryChangelogPopup", `showHistoryChangelogPopup(${megaModChangelog})`
        ).replace(
            `<div id="btn`,
            `<button v-if="${megaModChangelog}" @click="openMegaModInfo" class="ss_button btn_yolk bevel_yolk ss_margintop_lg">{{ loc.megaMod_changelog_wtc }}</button> <div id="btn`
        );
    
        // Add Footer Changelog
        const footer = document.getElementById("footer-links-panel-template");
        footer.innerHTML = footer.innerHTML.replace("onChangelogClicked", "onChangelogClicked(false)").replace(
            `version }}</button> | `,
            `version }}</button> | 
            <button class="ss_button_as_text" target="_blank" @click="onChangelogClicked(true)">The MegaMod <i class='fas fa-tools fa-sm'></i></button> | 
            <button class="ss_button_as_text modServer" target="_blank" @click="onServerClicked"><img src="${unsafeWindow.rawPath}/img/assets/logos/modServer.png" class='serverIcon'></img></button> | `);
    
        Object.assign(vueData.changelog, { isMegaMod: false, showMegaModHistoryBtn: true, megaMod: {} });
        vueData.openMegaModInfo = () => {
            open(cdnPath);
            BAWK.play("ui_click");
        };
    
    
        // Challenge Status (Icon + Tooltip)
        const challenge = document.getElementById("player_challenge");
        challenge.innerHTML = challenge.innerHTML.replace(
            `<div ref="title"`,
            `<div class="player-challenge-tool-tip status">
                <div class="tool-tip">
                    <i class="challenge-status" :class="iconClass"></i>
                    <span class="tool-tip-text" v-html="tooltipTxt"></span>
                </div>
            </div>
            <div ref="title"`
        ).replace(
            `class="player-challenge-single`,
            `:class="{ 'claimed' : data.claimed }" class="player-challenge-single`
        );
    
        Object.assign(CompPlayerChallengeSingle.computed, {
            isFresh() {
                const timesClaimed = extern.account.challengesClaimed.filter(val => val == this.data.challengeId).length;
                const claimedToday = this.data.claimed && extern.account.challengesClaimed.slice(-extern.account.challenges.filter(c => c.claimed).length).includes(this.data.challengeId.toString());
                return !timesClaimed || timesClaimed === 1 && claimedToday;
            },
            iconClass() {
                return this.isFresh ? "fas6 fa-sparkles" : "fas6 fa-history";
            },
            tooltipTxt() {
                return this.loc[this.isFresh ? 'challenges_new' : 'challenges_repeat'];
            }
        });
    
        const oldActionBtnClick = CompPlayerChallengeSingle.methods.onActionBtnClick;
        CompPlayerChallengeSingle.methods.onActionBtnClick = function(...args) {
            if ((this.data.reset || this.completed) && !this.onClaimClicked) {
                extern.account.challengesClaimed.push(this.data.challengeId.toString());
                extern.account.challengesClaimedUnique = [...new Set(extern.account.challengesClaimed)];
                Object.assign(vueApp.challengesClaimed, {
                    total: extern.account.challengesClaimed.length,
                    unique: extern.account.challengesClaimedUnique.length
                });
            }
            oldActionBtnClick.apply(this, args);
        };
        
        // (Home Screen) Clock Icon Next To Challenge Timer, Challenge Info Button
        const chlgInfoIcon = `<i v-show="${chlgUpgrades}" class="fas fa-info-circle info-btn" @click="showChallengeInfo()"></i>`;
        const mediaTabs = document.getElementById("media-tabs-template");
        mediaTabs.innerHTML = mediaTabs.innerHTML.replace(
            `<span v-show="challengeDailyData.days"`,
            `<i v-show="${chlgUpgrades}" class="far fa-clock"></i><span <span v-show="challengeDailyData.days"`
        ).replace(
            `</span>\n\t\t\t\t</h4>\n\t\t\t\t<div class="display-grid`,
            `${chlgInfoIcon}</span>\n\t\t\t\t</h4>\n\t\t\t\t<div class="display-grid`
        );
    
        // (Respawn Menu) Challenge Info Button
        const challengeList = document.getElementById("player_challenge_list");
        challengeList.innerHTML = challengeList.innerHTML.replace(
            `loc.challenges }}</h4>`,
            `loc.challenges }} ${chlgInfoIcon}</h4>`
        );
    
        // FontAwesome Regular Icon on Homepage (to have the icon font loaded for everything else) 
        const gameInfo = document.getElementById("gameDescription");
        gameInfo.innerHTML = gameInfo.innerHTML.replace(
            `>{{ loc.home_desc_about }}`,
            `><i v-show="${betterUIEnabled}" class="far6 fa-egg-fried"></i> 
            {{ loc.home_desc_about }}
            <i v-show="${betterUIEnabled}" class="fas6 fa-egg-fried"></i>`
        );

        const localizeNumber = (id, vals) => {
            const template = document.getElementById(id);
            vals.forEach(val => {
                template.innerHTML = template.innerHTML.replace(val, `(typeof ${val} === 'number' ? ${val.trim()}.addSeparators() : ${val})`);
            });
        };

        [
            { id: "account-panel-template", vals: ['eggBalance'] },
            { id: "the-stat-template", vals: ['statLifetime', 'statMonthly'] },
            { id: "stats-stats-template", vals: ['challengesClaimed.total', 'challengesClaimed.unique'] },
            { id: "player_challenge", vals: ['trueProgress', ' reward '] }, 
            { id: "equip-screen-template", vals: ['equip.buyingItem.price'] },
            { id: "price-tag-template", vals: ['item.price'] },
        ].forEach(x => localizeNumber(x.id, x.vals))

        const giveStuff = document.getElementById('give-stuff-popup');
        giveStuff.innerHTML = giveStuff.innerHTML.replace(`{{giveStuffPopup.eggs}}`, `{{ giveStuffPopup.eggs && giveStuffPopup.eggs.addSeparators() }}`);

        const oldGetGoal = CompPlayerChallengeSingle.computed.getGoal;
        CompPlayerChallengeSingle.computed.getGoal = function() {
            const oldGoal = oldGetGoal.call(this);
            switch(this.subType) {
                case 'timePlayed':
                    if (this.type !== 'kills') return Math.floor(this.data.goal / 60).addSeparators(); // removed + 'm'
                    break;
                case 'distance':
                    return this.data.goal.addSeparators(); // removed + 'm'
            }
            return typeof oldGoal === "number" ? oldGoal.addSeparators() : oldGoal;
        };

        const oldSetupStat = StatTemplate.methods.setupStat;
        StatTemplate.methods.setupStat = function(stat) {
            if (stat?.length && !this.stat.kdr) stat = stat.map(s => typeof s === "number" ? s.addSeparators() : s);
			return oldSetupStat.call(this, stat);
		};

        const oldPlayAdText = CompChwHomeScreen.computed.playAdText;
        CompChwHomeScreen.computed.playAdText = function() {
            const oldTxt = oldPlayAdText.call(this);
            return this.chw.limitReached ? this.loc.chw_wake.format((200 * (this.chw.resets + 1)).addSeparators()) : oldTxt;
        };
        const oldPauseScreenStateClass = comp_game_screen.computed.pauseScreenStateClass;
        Object.assign(comp_game_screen.computed, {
            wakeTheChw() {
                return `(${this.loc.chw_wake.format((200 * (this.chw.resets + 1)).addSeparators())})`;
            },
            chwShowCountdown() {
                if (this.isChicknWinnerError) {
                    return 'hideme';
                } else {
                    if (this.chw.ready) {
                        return 'hideme';
                    } else {
                        return 'display-inline';
                    }
                }
            },
            progressMsg() {
                if (this.chw.adBlockDetect) {
                    return 'Please turn off ad blocker';
                }
                if (this.isChicknWinnerError) {
                    return this.loc.chw_error_text;
                }
                if (this.chw.limitReached && !this.chw.ready) {
                    return this.loc.chw_daily_limit_msg;
                }
                if (this.chw.ready) {
                    return this.chw.winnerCounter > 0 ? this.loc.chw_cooldown_msg : this.loc.chw_ready_msg;
                }
                return this.loc.chw_time_until;
            },
            pauseScreenStateClass() {
                return `${oldPauseScreenStateClass.call(this) || ''} game-mode-${this.game.gameType}`;
            }
        });

         // Show Chick'n Winner Owned Item
        Object.assign(vueData.chw.reward, {
            ownedItem: null,
            theme: ""
        });
        const oldBusted = comp_chickn_winner_popup.watch.busted;
        comp_chickn_winner_popup.watch.busted = function(val) {
            oldBusted.call(this, val);
            if (extern.modSettingEnabled("betterUI_cw") && this.rewardItem) this.reward.theme = extern.getThemeForItem(this.rewardItem);
        }
        const oldRewardItem = comp_chickn_winner_popup.computed.rewardItem;
        Object.assign(comp_chickn_winner_popup.computed, {
            // Add Separators
            showAmountRewarded() {
                if (this.reward.eggs) return `+${this.reward.eggs.addSeparators()}`;
            },
            rewardHasOwnedItem() {
                return this.reward.ownedItem !== null && this.reward.eggs && this.busted;
            },
            rewardItem() {
                return this.rewardHasOwnedItem ? extern.catalog.findItemById(this.reward.ownedItem) : oldRewardItem.call(this);
            }
        });
        
        const oldResetGame = comp_chickn_winner_popup.methods.resetGame;
        Object.assign(comp_chickn_winner_popup.methods, {
            eggClass(count) {
                let hide;
                if (count > 5 && (this.reward.itemIds.length || (extern?.modSettingEnabled?.('betterUI_cw') && this.reward.ownedItem))) {
                    hide = 'visibility-hidden cyborg-egg';
                }
                if (count > 5) {
                    return `chick-alive ${hide} egg-${count} cyborg-egg`;
                }
            },
            resetGame(...args) {
                oldResetGame.apply(this, args);
                setTimeout(() => { this.reward.theme = ""; }, 500);
            }
        });

        const hasOwnedItem = `${chicknWinnerUpgrades} && rewardHasOwnedItem`;
        const chicknWinner = document.getElementById("chickn-winner-template");
        chicknWinner.innerHTML = chicknWinner.innerHTML.replace(
            `rewardHasItem`,
            `(rewardHasItem || (${hasOwnedItem}))`
        ).replace(
            `<div v-if="showAmountRewarded`,
            `<div :class="{ ownedItem: ${hasOwnedItem} }" v-if="showAmountRewarded`
        ).replace(
            `rewardItem.name }}</h4>`,
            `rewardItem.name }}</h4><h4 v-if="${hasOwnedItem}" class="text_white text-center nospace text-shadow-black-40">{{ loc.megaMod_betterUI_chwOwnedItem }}</h4>`
        ).replace(
            `<item`,
            `<item is-reward="true"`
        );
    }

    static addPopups() {
        const badgePopup = `
            <large-popup id="badgeInfoPopup" ref="badgeInfoPopup" hide-confirm="true" :overlay-close="true" class="megamod-popup">
                <template slot="content">
                    <h1 v-html="loc.megaMod_betterUI_badgePopup_title"></h1>
                    <p v-html="loc.megaMod_betterUI_badgePopup_desc"></p>
                    
                    <h3>{{ loc.megaMod_betterUI_badgePopup_main_title }} ({{ badgeInfo.main.length }})</h3>
                    <p class="badgeDesc" v-html="loc.megaMod_betterUI_badgePopup_main_desc"></p>
                    <div class="table-div">
                        <table class="roundme_md sortable">
                            <thead>
                                <tr>
                                    <th v-html="loc.megaMod_betterUI_badgePopup_header_badge"></th>
                                    <th v-html="loc.megaMod_betterUI_badgePopup_header_name"></th>
                                    <th v-html="loc.megaMod_betterUI_badgePopup_header_desc"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(badge, i) in badgeInfo.main">
                                    <td :data-sort="i">
                                        <i :title="loc[badge.title] || badge.title" :class="badge.classList" @click="badge.clickFunc"></i>
                                    </td>
                                    <td v-html="loc[badge.title] || badge.title"></td>
                                    <td v-html="badge.desc"></td>
                                </tr>
                            </tbody>
                        </table>
                        </div>
                        
                    <h3>{{ loc.megaMod_betterUI_badgePopup_tier_title }} ({{ badgeInfo.tier.length }})</h3>
                    <p class="badgeDesc" v-html="loc.megaMod_betterUI_badgePopup_tier_desc"></p>
                    <div class="table-div">
                        <table class="roundme_md sortable">
                            <thead>
                                <th v-html="loc.megaMod_betterUI_badgePopup_header_badge"></th>
                                <th v-html="loc.megaMod_betterUI_badgePopup_header_name"></th>
                                <th v-html="loc.megaMod_betterUI_badgePopup_header_desc"></th>
                            </thead>
                            <tbody>
                                <tr v-for="(badge, i) in badgeInfo.tier">
                                    <td :data-sort="i">
                                        <i :title="loc[badge.title] || badge.title" :class="badge.classList" @click="badge.clickFunc"></i>
                                    </td>
                                    <td v-html="loc[badge.title] || badge.title"></td>
                                    <td v-html="badge.desc"></td>
                                </tr>
                            </tbody>
                         </table>
                    </div>
                </template>
            </large-popup>
        `;
    
        const challengePopup = `
            <large-popup id="challengeInfoPopup" ref="challengeInfoPopup" hide-confirm="true" :overlay-close="true" class="megamod-popup">
                <template slot="content">
                    <h1 v-html="loc.megaMod_betterUI_challengePopup_title"></h1>
                    <p v-html="loc.megaMod_betterUI_challengePopup_desc"></p>
                    
                    <h3>{{ loc.megaMod_betterUI_challengePopup_list_title }} ({{ extern.Challenges.length }})</h3>
                    <div class="table-div">
                        <table class="roundme_md sortable">
                            <thead>
                                <tr>
                                    <th v-html="loc.megaMod_betterUI_challengePopup_header_icon"></th>
                                    <th v-html="loc.megaMod_betterUI_challengePopup_header_name"></th>
                                    <th v-html="loc.megaMod_betterUI_challengePopup_header_desc"></th>
                                    <th v-html="loc.megaMod_betterUI_challengePopup_header_reward"></th>
                                    <th v-html="loc.megaMod_betterUI_challengePopup_header_claims"></th>
                                    <th v-html="loc.megaMod_betterUI_challengePopup_header_tier"></th>
                                    <th v-html="loc.megaMod_betterUI_challengePopup_header_type"></th>
                                    <th v-html="loc.megaMod_betterUI_challengePopup_header_subtype"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="challenge in extern.Challenges">
                                    <td :data-sort="challenge.id">
                                        <img :src="extern.playerChallenges.iconSrc(challenge.loc_ref)"></img>
                                    </td>
                                    <td>{{ loc[challenge.loc_ref + '_title'] }}</td>
                                    <td>{{ loc[challenge.loc_ref + '_desc'] }}</td>
                                    <td :data-sort="challenge.reward"> 
                                        <div class="egg-icon display-grid grid-column-auto-1"> 
                                            <img src="img/svg/ico_goldenEgg.svg">
                                           {{ challenge.reward.addSeparators() }}
                                        </div>
                                    </td>
                                    <td>{{ vueData.getChallengeClaims(challenge.id) }}</td>
                                    <td>{{ challenge.tier + 1 }}</td>
                                    <td>{{ PrettyChallengeType[challenge.type] || "N/A" }}</td>
                                    <td>{{ PrettyChallengeSubType[challenge.subType] || "N/A" }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </large-popup>
        `;
    
        const publicMaps = `vueData.maps.filter(m => m.availability === 'both')`;
        const mapPopup = `
            <large-popup id="mapPopup" ref="mapPopup" hide-confirm="true" :overlay-close="true" class="megamod-popup">
                <template slot="content">
                    <h1 v-html="loc.megaMod_betterUI_mapPopup_title"></h1>
                    <p v-html="loc.megaMod_betterUI_mapPopup_desc"></p>
    
                    <h3>{{ loc.megaMod_betterUI_mapPopup_list_title }} ({{ ${publicMaps}.length }})</h3>
                    <div class="table-div">
                        <table class="roundme_md sortable">
                            <thead>
                                <tr>
                                    <th v-for="mode in ['map', 'gametype_ffa', 'gametype_teams', 'gametype_ctf', 'gametype_king']" v-html="loc[mode]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="map in ${publicMaps}">
                                    <td :data-sort="map.name" class="map-image"> 
                                        <div id="private_maps" class="roundme_md" :style="{ backgroundImage: \`url(/maps/\${map.filename}.png)\` }">
                                            <div id="mapNav">
                                                <h5 id="mapText" class="text-shadow-black-40">
                                                    {{ map.name }}
                                                    <span class="map_playercount text-shadow-black-40 font-nunito box_absolute">
                                                        <icon class="map-avg-size-icon fill-white shadow-filter" :name="getMapSizeIcon(map.numPlayers)"></icon>
                                                    </span>
                                                </h5>
                                            </div>
                                        </div>
                                    </td>
                                    <td v-for="mode in ['FFA', 'Teams', 'Spatula', 'King']" :data-sort="map.modes[mode]" class="map-mode"> 
                                        <i v-if="map.modes[mode]" class="fas fa-check"></i>
                                        <i v-else class="fas fa-times"></i>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </large-popup>
        `;

        const gameFilter = ".filter(game => maps.map(map => map.filename).includes(game.map.filename))";
        const gameHistoryPopup = `
            <large-popup id="gameHistoryPopup" ref="gameHistoryPopup" hide-confirm="true" :overlay-close="true" class="megamod-popup">
                <template slot="content">
                    <h1 v-html="loc.megaMod_betterUI_gameHistoryPopup_title"></h1>
                    <p v-html="loc.megaMod_betterUI_gameHistoryPopup_desc"></p>
    
                    <h3>{{ loc.megaMod_betterUI_gameHistoryPopup_list_title }} ({{ gameHistory?${gameFilter}.length }})</h3>
                    <div class="table-div">
                        <table class="roundme_md sortable">
                            <thead>
                                <tr>
                                    <th v-for="key in ['map', 'megaMod_betterUI_gameHistoryPopup_column_mode', 'server', 'megaMod_betterUI_gameHistoryPopup_column_visibility', 'megaMod_betterUI_gameHistoryPopup_column_code']" v-html="loc[key]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="lobby in (gameHistory || []).slice().toReversed()${gameFilter}" @click="openGameCode(lobby.gameCode, lobby?.isOpen)">
                                    <td :data-sort="lobby.map.name" class="map-image"> 
                                        <div id="private_maps" class="roundme_md" :style="{ backgroundImage: \`url(/maps/\${lobby.map.filename}.png)\` }">
                                            <div id="mapNav">
                                                <h5 id="mapText" class="text-shadow-black-40">
                                                    {{ lobby.map.name }}
                                                    <span class="map_playercount text-shadow-black-40 font-nunito box_absolute">
                                                        <icon class="map-avg-size-icon fill-white shadow-filter" :name="getMapSizeIcon(maps.find(m => m.filename === lobby.map.filename)?.numPlayers || 0)"></icon>
                                                    </span>
                                                </h5>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{{ loc[lobby.modeLoc] }}</td>
                                    <td>{{ loc[lobby.serverLoc] }}</td>
                                    <td>
                                        {{ lobby.isPrivate ? loc.stat_private : loc.stat_public }}
                                    </td>
                                    <td :data-sort="lobby.gameCode"> 
                                        <a class="gameCode" :class="{ closed: !lobby?.isOpen }" @click="openGameCode(lobby.gameCode, lobby?.isOpen)">{{ lobby.gameCode }}</a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </large-popup>
        `;

        const banHistoryPopup = `
            <large-popup id="banHistoryPopup" ref="banHistoryPopup" hide-confirm="true" :overlay-close="true" class="megamod-popup">
                <template slot="content">
                    <div>
                        <div class="play-panel-panels roundme_md">
                            <h1 v-html="loc.megaMod_betterEggforce_banHistoryPopup_title"></h1>
                            <p class="nospace" v-html="loc.megaMod_betterEggforce_banHistoryPopup_desc"></p>
            
                            <h3 class="nospace">{{ loc.megaMod_betterEggforce_banHistoryPopup_list_title }} ({{ showingBanHistory?.length + (banHistorySearch?.length ? "/" + banHistory?.length : '') }})</h3>
                            <div id="item-search-wrap" class="fullwidth item-search-wrap box_relative ">
                                <label class="centered_y item-search-label ss_marginright_sm">
                                    <i class="fas fa-search text_blue3 fa-search"></i>
                                </label> 
                                <input :placeholder="loc.megaMod_betterEggforce_banHistoryPopup_search" v-model="banHistorySearch" @keyup="onBanSearchChange(true)" class="ss_field fullwidth font-nunito roundme_lg box_relative"> 
                            </div>
                            <div class="table-div ban-table">
                                <table class="roundme_md sortable">
                                    <thead>
                                        <tr>
                                            <th v-for="key in ['megaMod_betterEggforce_banHistoryPopup_column_date', 'megaMod_betterEggforce_banHistoryPopup_column_name', 'megaMod_betterEggforce_banHistoryPopup_column_id', 'megaMod_betterEggforce_banHistoryPopup_column_reason', 'megaMod_betterEggforce_banHistoryPopup_column_duration', 'map', 'megaMod_betterUI_gameHistoryPopup_column_mode', 'server', 'megaMod_betterUI_gameHistoryPopup_column_visibility', 'megaMod_betterUI_gameHistoryPopup_column_code']" v-html="loc[key]"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(ban, index) in (showingBanHistory || []).slice().toReversed()" @click="onBanSelect(index, ban.player.uniqueId)" :class="{ 'selected': index === selectedBanIndex  }">
                                            <td :data-sort="new Date(ban.date).getTime()">{{ getBanDate(ban.date) }}</td>
                                            <td>{{ ban.player.name }}</td>
                                            <td>{{ ban.player.uniqueId }}</td>
                                            <td>{{ ban.ban.reason }}</td>
                                            <td :data-sort="ban.ban.duration">{{ getBanDuration(ban.ban.duration) }}</td>
                                            <td :data-sort="ban.map.name" class="map-image"> 
                                                <div id="private_maps" class="roundme_md" :style="{ backgroundImage: \`url(/maps/\${ban.map.filename}.png)\` }">
                                                    <div id="mapNav">
                                                        <h5 id="mapText" class="text-shadow-black-40">
                                                            {{ ban.map.name }}
                                                            <span class="map_playercount text-shadow-black-40 font-nunito box_absolute">
                                                                <icon class="map-avg-size-icon fill-white shadow-filter" :name="getMapSizeIcon(maps.find(m => m.filename === ban.map.filename)?.numPlayers || 0)"></icon>
                                                            </span>
                                                        </h5>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{{ loc[ban.modeLoc] }}</td>
                                            <td>{{ loc[ban.serverLoc] }}</td>
                                            <td>{{ ban.isPrivate ? loc.stat_private : loc.stat_public }}</td>
                                            <td :data-sort="ban.gameCode"> 
                                                <a class="gameCode" :class="{ closed: !ban?.isOpen }" @click="openGameCode(ban.gameCode, ban?.isOpen)">{{ ban.gameCode }}</a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div v-show="showingBanHistory?.length" class="play-panel-panels play-panel-panels-join roundme_md">
                            <div class="private-game-wrapper fullwidth">
                                <div class="inner-wrapper">
                                    <header>
                                        <h1 class="nospace">{{ loc.megaMod_betterEggforce_banHistoryPopup_player_title + (selectedUniqueID ? ' - ' + selectedUniqueID : '') }}</h1>
                                    </header>
                                    <h3 class="nospace">{{ loc.megaMod_betterEggforce_banHistoryPopup_list_title }} ({{ showingPlayerBanHistory?.length + (playerBanHistorySearch?.length ? "/" + playerBanHistory?.length : '') }})</h3>
                                    <div id="item-search-wrap" class="fullwidth item-search-wrap box_relative ">
                                        <label class="centered_y item-search-label ss_marginright_sm">
                                            <i class="fas fa-search text_blue3 fa-search"></i>
                                        </label> 
                                        <input :placeholder="loc.megaMod_betterEggforce_banHistoryPopup_search" v-model="playerBanHistorySearch" @keyup="onBanSearchChange(false)" class="ss_field fullwidth font-nunito roundme_lg box_relative"> 
                                    </div>
                                    <div class="table-div player-table">
                                        <table class="roundme_md sortable">
                                            <thead>
                                                <tr>
                                                    <th v-for="key in ['megaMod_betterEggforce_banHistoryPopup_column_date', 'megaMod_betterEggforce_banHistoryPopup_column_name', 'megaMod_betterEggforce_banHistoryPopup_column_reason', 'megaMod_betterEggforce_banHistoryPopup_column_duration', 'map', 'megaMod_betterUI_gameHistoryPopup_column_mode', 'server', 'megaMod_betterUI_gameHistoryPopup_column_visibility', 'megaMod_betterUI_gameHistoryPopup_column_code']" v-html="loc[key]"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="ban in (showingPlayerBanHistory || []).slice().toReversed()">
                                                    <td :data-sort="ban.date">{{ getBanDate(ban.date) }}</td>
                                                    <td>{{ ban.player.name }}</td>
                                                    <td>{{ ban.ban.reason }}</td>
                                                    <td :data-sort="ban.ban.duration">{{ getBanDuration(ban.ban.duration) }}</td>
                                                    <td :data-sort="ban.map.name" class="map-image"> 
                                                        <div id="private_maps" class="roundme_md" :style="{ backgroundImage: \`url(/maps/\${ban.map.filename}.png)\` }">
                                                            <div id="mapNav">
                                                                <h5 id="mapText" class="text-shadow-black-40">
                                                                    {{ ban.map.name }}
                                                                    <span class="map_playercount text-shadow-black-40 font-nunito box_absolute">
                                                                        <icon class="map-avg-size-icon fill-white shadow-filter" :name="getMapSizeIcon(maps.find(m => m.filename === ban.map.filename)?.numPlayers || 0)"></icon>
                                                                    </span>
                                                                </h5>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{{ loc[ban.modeLoc] }}</td>
                                                    <td>{{ loc[ban.serverLoc] }}</td>
                                                    <td>{{ ban.isPrivate ? loc.stat_private : loc.stat_public }}</td>
                                                    <td :data-sort="ban.gameCode"> 
                                                        <a class="gameCode" :class="{ closed: !ban?.isOpen }" @click="openGameCode(ban.gameCode, ban?.isOpen)">{{ ban.gameCode }}</a>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </large-popup>
        `;
    
        const errorPopups = `
            <small-popup id="disableModsPopup" ref="disableModsPopup" hide-close="true" hide-cancel="true" :overlay-close="true" class="megamod-popup">
                <template slot="header">
                    <h1 class="roundme_sm shadow_blue4 nospace text_white" v-html="loc.megaMod_disableModsPopup_title"></h1>
                </template>
                <template slot="content">
                    <p v-html="disableModsPopupContent"></p>
                </template>
                <template slot="confirm">{{ loc['ok'] }}</template>
            </small-popup>
            <small-popup id="modErrsPopup" ref="modErrsPopup" hide-close="true" hide-cancel="true" :overlay-close="true" class="megamod-popup">
                <template slot="header">
                    <h1 class="roundme_sm shadow_blue4 nospace text_white" v-html="loc.megaMod_modErrsPopup_title"></h1>
                </template>
                <template slot="content">
                    <p v-html="modErrsPopupContent"></p>
                </template>
                <template slot="confirm">{{ loc['ok'] }}</template>
            </small-popup>
        `;

        const updatePopups = `
            <small-popup id="modUpdatePopup" ref="modUpdatePopup" hide-close="true" @popup-confirm="openMegaModUpdate" class="megamod-popup">
                <template slot="header">
                    <h1 class="roundme_sm shadow_blue4 nospace text_white" v-html="loc.megaMod_updatePopup_title"></h1>
                </template>
                <template slot="content">
                    <p v-html="modUpdatePopupContent"></p>
                </template>
                <template slot="cancel">{{ loc['megaMod_updatePopup_cancelBtn'] }}</template>
                <template slot="confirm">{{ loc['megaMod_updatePopup_okBtn'] }}</template>
            </small-popup>
            <small-popup id="modUpdatedPopup" ref="modUpdatedPopup" hide-close="true" hide-cancel="true" :overlay-close="true" class="megamod-popup">
                <template slot="header">
                    <h1 class="roundme_sm shadow_blue4 nospace text_white" v-html="loc.megaMod_updatedPopup_title"></h1>
                </template>
                <template slot="content">
                    <p v-html="modUpdatedPopupContent"></p>
                    <h3>{{ loc['megaMod_updatePopup_infoTitle'] }}</h3>
                    <div class="changelog_content roundme_lg">
                        <section>
                            <ul>
                                <li v-for="data in updateContent.updateInfo" v-html="data"></li>
                            </ul>
                            <hr v-show="updateContent.updateInfo.length" class="blue">
                            <h3>{{ updateContent.currentChangelog.version }} - <i><time>{{ updateContent.currentChangelog.date }}</time></i></h3>
                            <ul>
                                <li v-for="data in updateContent.currentChangelog.content" v-html="data"></li>
                            </ul>
                        </section>
                    </div>
                </template>
                <template slot="confirm">{{ loc['megaMod_updatedPopup_okBtn'] }}</template>
            </small-popup>
            <small-popup id="modAnnouncementPopup" ref="modAnnouncementPopup" hide-close="true" hide-cancel="true" :overlay-close="true" class="megamod-popup">
                <template slot="header">
                    <h1 class="roundme_sm shadow_blue4 nospace text_white" v-html="loc.megaMod_announcementPopup_title"></h1>
                </template>
                <template slot="content">
                    <p v-html="modAnnouncement"></p>
                </template>
                <template slot="confirm">{{ loc['megaMod_announcementPopup_okBtn'] }}</template>
            </small-popup>
        `;

        const badgeNotifPopup = `
            <div id="badgeLevelUp" v-show="badgeMsg.showing" style="display: none;" class="centered_x in-game-notification">
                <h2 id="badgeTitle" class="text_white nospace">{{ loc[badgeMsg.titleLocKey] }}</h2>
                 <i id="badgeIcon" :class="badgeMsg.iconClass"></i>
                <p id="badgeName" :class="badgeMsg.badgeClass" class="nospace">{{ badgeMsg.badgeName }}</p>
            </div>
        `;

        const gameLeavePopup = `
            <small-popup id="leaveGameWarningPopup" ref="leaveGameWarningPopup" @popup-confirm="onLeaveGameConfirmedJoinGame" @popup-closed="onLeaveGameResetJoinGame" hide-close="true" @popup-cancel="onLeaveGameResetJoinGame">
                <template slot="header">{{ loc.leave_game_to_join_other_title }}</template>
                <template slot="content">
                    <p>{{ loc.leave_game_to_join_other_desc }}</p>
                    <div class="nowrap ss_margintop_lg ss_marginbottom_lg">
                        <i :class="icon.invite" class="text_blue5" style="size: 1em; zoom: 1.5;"></i>
                        <h1 class="display-inline ss_marginleft ss_marginright text_blue5">{{ leaveToJoinGameCode }}</h1>
                    </div>
                 </template>
                <template slot="cancel">{{ loc.no }}</template>
                <template slot="confirm">{{ loc.yes }}</template>
            </small-popup>
        `;

        // Add Popups
        const popupInterval = setInterval(() => {
            const gameDesc = document.getElementById('gameDescription');
            if (!gameDesc) return;
            clearInterval(popupInterval);
            gameDesc.insertAdjacentHTML('afterend', 
                `${gameLeavePopup} ${badgeNotifPopup} ${badgePopup} ${challengePopup} ${mapPopup} ${gameHistoryPopup} ${banHistoryPopup} ${errorPopups} ${updatePopups}`
            );
        });
        // CW Popup Theme
        const cwInterval = setInterval(() => {
            const cwPopup = document.getElementById('chicknWinner');
            if (!cwPopup) return;
            clearInterval(cwInterval);
            cwPopup.setAttribute(':class', 'chw.reward.theme');
        });
    }

    static addLoadLogo() {
        this.log("addLoadLogo() -", "Adding load screen MegaMod logo");

        const logoInterval = setInterval(() => {
            let progressContainer = document.getElementById('progress-container');
            if (!progressContainer) return;
            clearInterval(logoInterval);
            const megaModLogo = document.createElement('img');
            Object.assign(megaModLogo, {
                id: "megaModLogo",
                src: `${rawPath}/img/assets/logos/megaMod-${Math.randomInt(0, 5)}.png`,
                style: `
                    width: 19em;
                    display: block;
                    margin: 5em auto 0;
                    z-index: 2000;
                    position: absolute;
                    left: 50%;
                    bottom: 14em;
                    transform: translateX(-50%);
                    opacity: 0;
                    transition: opacity 1s ease-in-out;
                `
            });
            progressContainer.appendChild(megaModLogo);
            setTimeout(() => { megaModLogo.style.opacity = 1; }, 10); // using a @keyframes animation would be better but whatever
        });
    }

    static checkError() {
        this.log("checkError() -", "Checking for Fatal Errors"); 
        this.log("Fatal Error:", MegaMod.fatalErr);
        this.log("Fatal Error Version:", localStore.getItem(MegaMod.KEYS.ErrVersion));
        const reloads = parseInt(localStore.getItem(MegaMod.KEYS.ErrReloads)) || 0;
        this.log("Reload Count:", reloads); 

        MegaMod.createFocusTimer(1000, 90_000, function() {
            MegaMod.setFatalErr(document.getElementById("logo-svg") != null);
            if (MegaMod.fatalErr) {
                if (reloads === 3) {
                    localStore.setItem(MegaMod.KEYS.ErrVersion, GM_info.script.version);
                    if (confirm(`A fatal error has occured while starting the MegaMod.\n\nPlease press \"Ok\" to reload.\n\nThe MegaMod will automatically be disabled and will be enabled as soon as the next update is available and installed.`)) window.location.reload();
                } else {
                    localStore.setItem(MegaMod.KEYS.ErrReloads, reloads == null ? 1 : reloads + 1);
                    if (confirm(`Hmmmm....loading seems to be taking longer with The MegaMod.\n\nPlease press \"Ok\" to reload.\n\nThe MegaMod will automatically disable itself after ${3 - reloads} more reload attempt(s).`)) window.location.reload();
                }
            } else if (reloads > 0) {
                localStore.setItem(MegaMod.KEYS.ErrReloads, 0);
            }
        });
    }

    static editSource(src) {
        this.log("editSource() -", "Editing shellshock.js");
        localStore.setItem(MegaMod.KEYS.InitFinished, false);
        if (MegaMod.fatalErr) return src;
        this.checkError();
        const regex = (strings, ...values) => new RegExp(strings.raw.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""), "g");
        const escSymbols = x => x.replaceAll(/[\$_]/g, '\\$&');

        String.prototype.safeReplace = function(searchStr, replacement, ids, all = false) {
            ids = Array.isArray(ids) ? ids : [ids];
            //MegaMod.log("Replacing:", `${searchStr} --> ${replacement}`);
            const str = this.toString();
            if (str.indexOf(searchStr) === -1) {
                ids.forEach(id => unsafeWindow.megaMod.addRegexErrId(id));
                MegaMod.error("Match not found for:", searchStr);
                return str;
            }
            return all ? str.replaceAll(searchStr, replacement) : str.replace(searchStr, replacement);
        };
        String.prototype.safeMatchAll = function(regex, ids, ignoreSymbols = false) {
            ids = Array.isArray(ids) ? ids : [ids];

            if (!regex.global) {
                MegaMod.error("RegExp must have the global (g) flag for matchAll:", regex);
                return [];
            }

            const matches = [...this.matchAll(regex)];
            if (!matches.length) {
                ids.forEach(id => unsafeWindow.megaMod.addRegexErrId(id));
                MegaMod.error("matchAll found no matches for RegExp pattern:", regex);
                return [];
            }
            return matches.map(match => ignoreSymbols ? match : match.map((m, i) => i ? m.replace(/_/g, "\\_").replace(/\$/g, "\\$") : m));
        };
        RegExp.prototype.safeExec = function(src, ids, ignoreSymbols = false) {
            ids = Array.isArray(ids) ? ids : [ids];
            const match = this.exec(src);
            if (!match) {
                ids.forEach(id => unsafeWindow.megaMod.addRegexErrId(id));
                MegaMod.error("Exec not found for RegExp pattern:", this);
                return [];
            }
            return ignoreSymbols ? match : match?.map((m, i) => i ? m.replace("_", "\_").replace("$", "\$") : m);
        };
        
        // Minified Variable Regex
        const v = `[a-zA-Z_$][a-zA-Z0-9_$]*`;
    

        // Player Matches
        const [,spectatingPlayer, playerArr] = regex`((${v})\[this\.playerIdx\])\;`.safeExec(src, "matchGrenades");

        // Match Grenade Pickups
        const [,itemManagerClass] = regex`(${v})\.Constructors`.safeExec(src, "matchGrenades");
        let itemManagerInst;
        if (itemManagerClass) {
            const [itemManagerInit, tempItemManagerInst] = regex`(${v})\=new\s${escSymbols(itemManagerClass)}`.safeExec(src, "matchGrenades");
            if (itemManagerInit && tempItemManagerInst) {
                itemManagerInst = tempItemManagerInst;
                const [,meshVar] = regex`this\.(${v})\.rotation\.y\+\=\.[0-9]+\*${v}`.safeExec(src, "matchGrenades");
                if (meshVar) {
                    const [newGrenadePool] = regex`new\s${v}\(\(function\(\)\{return\snew\s${v}\.Constructors\[${v}\.GRENADE\]\}\)\,20\)`.safeExec(src, "matchGrenades");
                    if (newGrenadePool) {
                        // cloneMesh for other grenades
                        const [cloneGrenadeMesh] = regex`${v}\(${v}\.catalog\.grenades\[${v}\]\.item_data\.meshName\,${v}\,null\,${v}\.getMaterialByName\(\"emissive\"\)\)\.setEnabled\(\!1\)`.safeExec(src, "matchGrenades");
                        if (cloneGrenadeMesh) {
                            let standardInstancedMesh = cloneGrenadeMesh.safeReplace("emissive", "standardInstanced", "matchGrenades");
                            // cloneMesh for other grenades
                            if (standardInstancedMesh) src = src.safeReplace(cloneGrenadeMesh, `${standardInstancedMesh};${cloneGrenadeMesh};`, "matchGrenades");
    
                            // ItemManager Class Modifications
                            const updateGrenadesFunc = `,
                                ${itemManagerClass}.prototype.updateGrenades = function() {
                                    const grenadeData = [];
                                    const grenadePool = this.pools[${itemManagerClass}.GRENADE];
                                    grenadePool.forEachActive(item => {
                                        grenadeData.push({ id: item.id, position: item.${meshVar}.position, rotation: item.${meshVar}.rotation });
                                        item.remove();
                                    });
                                    this.pools[${itemManagerClass}.GRENADE] = ${newGrenadePool};
                                    grenadeData.forEach(({ id, position, rotation }) => {
                                        this.spawnItem(id, ${itemManagerClass}.GRENADE, position.x, position.y, position.z);
                                    });
                                    grenadePool.forEachActive(item => {
                                        item.${meshVar}.rotation = grenadeData.find(data => data.id === item.id).rotation;
                                    });
                                },
                                ${itemManagerClass}.currentGrenadeMesh = "grenadeItem",
                                ${itemManagerClass}.prototype.tryUpdateGrenades = function(grenadeMesh) {
                                    let g = "grenadeItem";
                                    if (extern?.modSettingEnabled?.("matchGrenades")) {
                                        g = grenadeMesh || extern.account.grenadeItem.item_data.meshName;
                                    }
                                    if (g !== ${itemManagerClass}.currentGrenadeMesh) {
                                        ${itemManagerClass}.currentGrenadeMesh = g;
                                        this.updateGrenades();
                                        window.megaMod.constructor.log("matchGrenades: updateGrenades() -", "Grenade Pickups Updated to " + ${itemManagerClass}.currentGrenadeMesh);
                                    }
                                },
                                ${itemManagerClass}.getCurrentGrenadeMesh = function() {
                                    return (extern?.modSettingEnabled?.("matchGrenades")) ? ${itemManagerClass}.currentGrenadeMesh : "grenadeItem";
                                }
                            `;
                            src = src.safeReplace(`,${itemManagerClass}.prototype.spawnItem`, `${updateGrenadesFunc},${itemManagerClass}.prototype.spawnItem`, "matchGrenades");
    
                            if (playerArr) {
                                // updateLegacySkinsInGame() Function
                                const updateLegacySkinsFunc = `
                                    extern.updateLegacySkinsInGame = (enabled) => {
                                        ${playerArr}.forEach(player => {
                                            [player.primaryWeaponItem, player.secondaryWeaponItem].forEach(item => {
                                                if (window.megaMod.legacyMode.constructor.itemIds.includes(item.id)) {
                                                    item.item_data.meshName = enabled ? (item.item_data.meshName.includes("_Legacy") ? item.item_data.meshName : item.item_data.meshName + "_Legacy") : item.item_data.meshName.replace("_Legacy", "");
                                                    player.changeWeaponLoadout(player.primaryWeaponItem, player.secondaryWeaponItem);
                                                }
                                            });
                                        });
                                    }
                                `;
                                // Adding tryUpdateGrenades() and updateLegacySkinsInGame() to extern
                                src = src.safeReplace(itemManagerInit, `${itemManagerInit},${updateLegacySkinsFunc},extern.tryUpdateGrenades=${itemManagerInst}.tryUpdateGrenades.bind(${itemManagerInst})`, ["matchGrenades", "legacyMode_skins"]);
                            }
    
                            // Initial Custom Grenade
                            src = src.safeReplace(`switchToGameUi(),`, `switchToGameUi(), extern?.tryUpdateGrenades?.(),`, "matchGrenades");
                            src = src.safeReplace(`getMeshByName("grenadeItem"`, `getMeshByName(${itemManagerClass}.getCurrentGrenadeMesh()`, "matchGrenades");
    
                            // Calling checkCurrentGrenadeMesh() when updating loadout
                            src = src.safeReplace("generateLoadoutObject();", `generateLoadoutObject();if(extern.inGame){extern?.tryUpdateGrenades?.()}`, "matchGrenades");
    
                            // Calling checkCurrentGrenadeMesh() during first-person spectate
                            const specMatches = Array.from(src.safeMatchAll(regex`this\.spectatePlayer\(${v}\)`, "matchGrenades"));
                            if (spectatingPlayer && specMatches.length) {
                                specMatches.forEach(([match]) => {
                                    src = src.safeReplace(match, `(${match}, extern.tryUpdateGrenades(${spectatingPlayer}.grenadeItem.item_data.meshName))`, "matchGrenades", true);
                                });
                            }
    
                            // Calling checkCurrentGrenadeMesh() when exiting first-person spectate
                            src = src.safeReplace(`.freeCamera()`, `.freeCamera(),${itemManagerInst}.tryUpdateGrenades()`, "matchGrenades");
                        }
                    }
                }
            }
        }

        // Photobooth Spin
        const [paperDollMatch, paperDollClass] = regex`(${v})\.prototype.poseWithItems`.safeExec(src, "pbSpin");
        if (paperDollMatch && paperDollClass) {
            const [,pdActorVar] = regex`dualAvatar\.(${v})\.setupStowAnims`.safeExec(src, "pbSpin");
            if (pdActorVar) {
                const [,pdMeshVar] = regex`dualAvatar\.${escSymbols(pdActorVar)}\.(${v})\.scaling`.safeExec(src, "pbSpin");
                if (pdMeshVar) {
                    const spinEggFuncs = `
                            ${paperDollClass}.prototype.spinning = false,
                            ${paperDollClass}.prototype.spinEgg = function(time, steps, frameFunc) {
                                const meshY = this.avatar.${pdActorVar}.${pdMeshVar}.rotation.y;
                                const headY = this.avatar.${pdActorVar}.head.rotation.y;
                                const oldUpdate = this.update;
                                this.update = () => {};
                                const frameDelay = time / steps;
                                let currentStep = 0;
    
                                if (this.spinning) return;
                                this.spinning = true;
                                
                                if (frameFunc) window.megaMod.photoboothEggSpin.setupGIF();
                                const spinInterval = setInterval(() => {
                                    this.avatars(a => {
                                        // Calculate rotation angle and wrap back to 0 after 2π
                                        a.${pdActorVar}.${pdMeshVar}.rotation.y = (a.${pdActorVar}.${pdMeshVar}.rotation.y + Math.PI2 / steps) % Math.PI2;
                                    });
                                    const lastFrame = ++currentStep >= steps;
                                    if (frameFunc) frameFunc(frameDelay, lastFrame);
                                    if (lastFrame) {
                                        this.spinning = false;
                                        this.avatars((a) => {
                                            a.${pdActorVar}.${pdMeshVar}.rotation.y = meshY;
                                            a.${pdActorVar}.head.rotation.y = headY;
                                        });
                                        this.update = oldUpdate;
                                        clearInterval(spinInterval);
                                    }
                                }, frameDelay);
                            }
                        `;
                        src = src.safeReplace(paperDollMatch, `${spinEggFuncs},${paperDollMatch}`, "pbSpin");
                        src = src.safeReplace("this.scene.registerBeforeRender", `extern.spinEgg=this.spinEgg.bind(this);this.scene.registerBeforeRender`, "pbSpin");
                }
            }
        }
        
        // Custon Skybox
        const [,fromHexStringFunc] = regex`(${v}\.FromHexString)\(`.safeExec(src, ["customSkybox", "customFog"]);
        const [skyboxInit, skyboxName] = regex`\"img\/skyboxes\/\"\+(${v})`.safeExec(src, "customSkybox");
        if (skyboxInit && skyboxName) {
            let [cubeTextureMatch] = regex`\.reflectionTexture=new.*?\)`.safeExec(src, "customSkybox");
            src = src.safeReplace(skyboxInit, `(extern?.modSettingEnabled?.("customSkybox") ? (extern.getSkybox() || ${skyboxInit})  : ${skyboxInit})`, "customSkybox");
            const [skyboxVarMatch, skyboxVar] = regex`(${v})\.infiniteDistance\=\!0\;`.safeExec(src, "customSkybox");
            if (cubeTextureMatch && skyboxVarMatch && skyboxVar) {
                src = src.safeReplace(skyboxVarMatch, `${skyboxVarMatch}window.megaMod.setMapSkybox(${skyboxVar});`, "customSkybox")
                cubeTextureMatch = `window.megaMod.customSkybox.mapSkybox.material${cubeTextureMatch}`;
                const customCubeTexture = cubeTextureMatch.safeReplace(skyboxInit, `extern.getSkybox()`, "customSkybox");
                const [,mapDataVar] = regex`(${v})\.skybox\|\|`.safeExec(src, "customSkybox");
                if (mapDataVar) {
                    cubeTextureMatch = cubeTextureMatch.safeReplace(`+${skyboxName}+`, `+${mapDataVar}.skybox+`, "customSkybox");
                    const [,skyboxModeVar] = regex`\.TEXTURE_SKYBOX_MODE\=([a-zA-Z0-9"][a-zA-Z0-9"]*)`.safeExec(src, "customSkybox");
                    if (fromHexStringFunc && skyboxModeVar) {
                        const skyboxFunc = `
                            updateSkybox: (enabled = false, hex="#ffffff") => {
                                const skybox = window.megaMod.customSkybox?.mapSkybox;
                                if (!skybox) return;
                                if (!enabled || !window.megaMod.customSkybox.usingSkyboxColor) hex = "#000000";
                                skybox.material.emissiveColor = ${fromHexStringFunc}(hex);
                                if (enabled && !window.megaMod.customSkybox.usingSkyboxColor) {
                                    ${customCubeTexture};
                                } else {
                                    ${cubeTextureMatch};
                                    skybox.material.reflectionTexture = enabled ? null : skybox.material.reflectionTexture;
                                }
                                if (skybox.material.reflectionTexture) skybox.material.reflectionTexture.coordinatesMode = ${skyboxModeVar}; // BABYLON.Texture.SKYBOX_MODE --> 5
                            }
                        `;
                        src = src.safeReplace("catalog:", `${skyboxFunc},catalog:`, "customSkybox");
                        src = src.safeReplace("crazySdk.showInviteButton", "(window.megaMod.customSkybox.usingSkyboxColor && window.megaMod.customSkybox.onSkyboxCategoryChanged('colors')),(extern?.modSettingEnabled?.('customSkybox_randomSkybox') && window.megaMod.customSkybox.randomizeSkybox()),crazySdk.showInviteButton", "customSkybox");
                    }
                }
            }
        }
    
        // Spectate Speed
        src = src.safeReplace(".016*", `.016*extern.getSpecSpeed()*`, "specTweaks_speed", true);
        src = src.safeReplace(".008*", `.008*extern.getSpecSpeed()*`, "specTweaks_speed", true);
    
        // Color Slider Non-VIP Fix
        const [vipCheckMatch] = regex`\!${v}\.playerAccount\.isSubscriber`.safeExec(src, "colorSlider");
        if (vipCheckMatch) src = src.safeReplace(vipCheckMatch, `${vipCheckMatch} && !extern?.usingSlider?.()`, "colorSlider");
    
        // VIP Slider Color In-Game Init
        let actorVar = null;
        const [mePlayerInit, mePlayerVar, playerInst] = regex`\((${v})\=(${v})\)\.ws`.safeExec(src, "colorSlider");
        if (mePlayerInit && mePlayerVar) {
            const [,meActorVar] = regex`${escSymbols(mePlayerVar)}\.(${v})\.hit\(\)`.safeExec(src, "colorSlider");
            if (meActorVar) {
                actorVar = meActorVar;
                src = src.safeReplace(mePlayerInit, `(extern?.usingSlider?.() && vueApp.equip.colorIdx === 14 && ${playerInst}.${meActorVar}.setShellColor(14)), ${mePlayerInit}`, "colorSlider");
            }
        }
        src = src.safeReplace("this.upgradeExpiryDate:", "(this.upgradeExpiryDate || extern?.usingSlider?.() && this.colorIdx === 14):", "colorSlider");
    
        // Freeze Frame
        const [,freezeVar] = regex`\"\\\\\"\=\=${v}\)\{(${v})\=\!0`.safeExec(src, "specTweaks_freezeKeybind");
        // Gamemodes go out of sync
        //const [,freezeVarKotc] = regex`removeAll\(\)\,(${v})\=\!0`.safeExec(src, "specTweaks_freezeKeybind");
        if (freezeVar /*&& freezeVarKotc*/) {
            const freezeFunc = `
                freezeFrame: (enabled) => {
                    ${freezeVar} = enabled;	
                    const messageLoc = enabled ? 'megaMod_specTweaks_frozen' : 'megaMod_specTweaks_unfrozen';
                     if (!vueApp.game.isPaused) vueApp.$refs.gameScreen.showInGameNotif(messageLoc);
                    // freezeVarKotc = enabled;
                    // window.megaMod.spectateTweaks.frozen = enabled;
                }
            `;
            src = src.safeReplace("catalog:", `${freezeFunc},catalog:`, "specTweaks_freezeKeybind");
    
            /*
            // This bugs the game because things aren't synced after un-freeze
            const [freezeMatch] = regex`isMoreDataAvailable\(\)\;\)\{`.safeExec(src, "specTweaks_freezeKeybind");
            if (freezeMatch) {
                src = src.safeReplace(freezeMatch, `${freezeMatch}if (window.megaMod.spectateTweaks.frozen)break;`, "specTweaks_freezeKeybind");
            }
            */
        }
    
        // Hide Nametags, Outlines, & Pickups
        const [,teamColors] = regex`(${v})\.outline\[`.safeExec(src, ["hideHUD_nametags", "hideHUD_outlines", "betterChat_chatEvents"]);
        if (teamColors && itemManagerInst && itemManagerClass) {
            const hideHUDFuncs = `
                hideNametags: (hide) => ${teamColors}.textColor.forEach(c => c.a = +!hide),
                hideOutlines: (hide) => ${teamColors}.outline.forEach((c, i) => c.a = (!hide && i) ? 0.3 : -1),
                hidePickups: (hide) => ${itemManagerInst} && (${itemManagerInst}.itemsHidden = hide)
            `;
            src = src.safeReplace("catalog:", `${hideHUDFuncs},catalog:`, ["hideHUD_nametags", "hideHUD_outlines", "hideHUD_pickups"]);
            src = src.safeReplace(`,${itemManagerClass}.prototype.spawnItem`, `${itemManagerClass}.itemsHidden=false,${itemManagerClass}.prototype.spawnItem`, "hideHUD_pickups");
            const [pickupMatch, pickupMeshVar, pickupVisible] = regex`(${v}\.${v})\.isVisible\=(${v}\(\1\))\}\)`.safeExec(src, "hideHUD_pickups");
            if (pickupMatch && pickupVisible) {
                const newPickupMeshVar = `${pickupMatch.safeReplace(pickupVisible, `!this.itemsHidden && ${pickupVisible}`, "hideHUD")}.bind(this)`
                src = src.safeReplace(pickupMatch, newPickupMeshVar, "hideHUD_pickups");
            }
        }
        
        // Hit Indicator Color
        src = src.safeReplace("this.colors[0]=1", `this.colors[0]=1, (extern?.modSettingEnabled?.("betterUI_hitMarkers") && (this.colors[1]=this.colors[5]=this.colors[9]=.9))`, "betterUI_hitMarkers");
    
        const hitIndicatorFunc = `
            switchColor(enabled) {
                const colors = new Array(12).fill(0);
                [0, 4, 8, 7].forEach(index => colors[index] = 1);
                [1, 5, 9].forEach(index => colors[index] = enabled ? 0.9 : 0);
                this.markers.forEach(t => t.mesh.updateVerticesData("color", colors)); // BABYLON.VertexBuffer.ColorKind --> "color";
            }
        `;
        src = src.safeReplace("resize(){", `${hitIndicatorFunc}resize(){`, "betterUI_hitMarkers");
    
        const [,hitMarkers] = regex`${v}\.hitMarkers\?(${v})\.show`.safeExec(src, "betterUI_hitMarkers");
        if (hitMarkers) src = src.safeReplace("catalog:", `switchHitMarkerColor: (enabled) => ${hitMarkers}.switchColor(enabled),catalog:`, "betterUI_hitMarkers");
    
        // Longer Chat
        const [chatLengthMatch] = regex`\}${v}\.length\>4`.safeExec(src, ["betterChat_longerChat", "betterChat_infChat"]);
        if (chatLengthMatch) src = src.safeReplace(chatLengthMatch, chatLengthMatch.replace(`>4`, `>(extern?.modSettingEnabled?.("betterChat_infChat") ? Number.MAX_SAFE_INTEGER : extern?.modSettingEnabled?.("betterChat_longerChat") ? 6 : 4)`));
    
        // Chat Events
        const [,playerClickFunc, uniqueIdVar] = regex`onclick\=(${v})\(${v}\.(${v})\,${v}\,${v}\)`.safeExec(src, "betterChat_chatEvents");
        const [,playerSocialFunc] = regex`\=(${v})\(${v}\.social\)`.safeExec(src, "betterChat_chatEvents");
        if (teamColors && playerClickFunc && playerSocialFunc) {
            const chatEventFunc = `
                function addChatEvent (type, player) {
                    if (!Object.values(ChatEvent).includes(type) || !player || !extern?.modSettingEnabled?.(ChatEventData[type].setting)) return;
                    
                    const chatOut = document.getElementById("chatOut");
                    const notMePlayer = !player.ws;
                    
                    const chatItem = document.createElement("div");
                    chatItem.classList.add("chat-item", "chat-event", \`type-\${type}\`);
                    chatItem.style.fontStyle = "italic";
                    if (notMePlayer) {
                        chatItem.classList.add("clickme");
                        const ISVIP = !player.hideBadge && player?.upgradeProductId > 0;
                        const GETSOCIALMEDIA = !player.hideBadge && ${playerSocialFunc}(player.social);
                        chatItem.onclick = ${playerClickFunc}(player.${uniqueIdVar}, GETSOCIALMEDIA, ISVIP);
                    }
                    
                    const nameDiv = document.createElement("div");
                    Object.assign(nameDiv.style, { display: "inline-block", color: ${teamColors}.text[player.team] });
                    
                    const eventIcon = document.createElement("i");
                    const iconClasses = ChatEventData[type]?.iconClass.split(" ") || ["fas", "fa-info-circle"];
                    eventIcon.classList.add(...iconClasses, "ss_marginright_xs", "chat-icon");
                    
                    const nameSpan = document.createElement("span");
                    nameSpan.classList.add("chat-player-name");
                    nameSpan.textContent = player.name;
                    nameDiv.append(eventIcon, nameSpan);
                    
                    const msgContent = document.createElement("span");
                    switch(type) {
                        case ChatEvent.switchTeam:
                            const teamText = document.createElement("span");
                            teamText.style.color = nameDiv.style.color;
                            teamText.textContent = vueApp.loc[teamLocs[player.team - 1]];
                            msgContent.innerHTML = vueApp.loc[ChatEventData[type].locKey].format(teamText.outerHTML);
                            break;
                        default:
                            msgContent.textContent = vueApp.loc[ChatEventData[type].locKey];
                    }
                    
                    chatItem.append(nameDiv, msgContent);
                    chatOut.appendChild(chatItem);

                    if (extern.modSettingEnabled("betterChat_infChat")) return;
                    const chatItems = Array.from(chatOut.querySelectorAll(".chat-item"));
                    chatItems.slice(0, Math.max(0, chatItems.length - 7)).forEach(item => item.remove());
                }
                let clientReady = false;
            `;
            src = src.safeReplace("window.BAWK", `${chatEventFunc}window.BAWK`, "betterChat_chatEvents");
        }

        // Join Game Chat Event
        const [joinGameMatch, joinPlayerVar] = regex`(${v}).${v}\|\|\1\.${v}\.removeFromPlay\(\)`.safeExec(src, ["betterChat_chatEvent_joinGame", "betterEggforce_autoBan"]);
        const chatEventFuncAdded = src.includes("clientReady = false;");
        if (chatEventFuncAdded) {
            const [gameJoinedMatch] = regex`vueApp\.gameJoined\(${v}`.safeExec(src, "betterChat_chatEvent_joinGame");
            if (gameJoinedMatch) src = src.safeReplace(gameJoinedMatch, `clientReady = false;${gameJoinedMatch}`, "betterChat_chatEvent_joinGame");
            src = src.safeReplace(`vueApp.delayInGamePlayButtons`, `clientReady = true;vueApp.delayInGamePlayButtons`, "betterChat_chatEvent_joinGame");
            if (joinGameMatch && joinPlayerVar) src = src.safeReplace(joinGameMatch, `if (clientReady) addChatEvent(ChatEvent.joinGame, ${joinPlayerVar});${joinGameMatch}`, "betterChat_chatEvent_joinGame");
        }

        // Leave Game Chat Event
        const [leaveGameMatch, leavePlayerVar] = regex`\b(?!this\b)(${v})\.${v}\.remove\(\)`.safeExec(src, "betterChat_chatEvent_leaveGame");
        if (chatEventFuncAdded && leaveGameMatch && leavePlayerVar) src = src.safeReplace(leaveGameMatch, `${leaveGameMatch},addChatEvent(ChatEvent.leaveGame, ${leavePlayerVar})`, "betterChat_chatEvent_leaveGame");
    
        // Switch Team Chat Event
        const [switchTeamMatch, switchPlayerVar] = regex`(${v})\.stats\.kills\=0`.safeExec(src, "betterChat_chatEvent_switchTeam");
        if (chatEventFuncAdded && switchTeamMatch && switchPlayerVar) src = src.safeReplace(switchTeamMatch, `addChatEvent(ChatEvent.switchTeam, ${switchPlayerVar}),${switchTeamMatch}`, "betterChat_chatEvent_switchTeam");

        // Spatula Chat Events
        const [captureMatch, capturePlayerVar, uniqueIDVar] = regex`(${v})\.ctsCapture\(${v}\.(${v})\)`.safeExec(src, ["betterChat_chatEvent_pickSpatula", "betterUI_spatula"]);
        if (captureMatch && capturePlayerVar) {
            if (chatEventFuncAdded) src = src.safeReplace(captureMatch, `(${captureMatch}, addChatEvent(ChatEvent.pickSpatula, ${capturePlayerVar}))`, "betterChat_chatEvent_pickSpatula");
            src = src.safeReplace(captureMatch, `${captureMatch}, ${capturePlayerVar}.showSpatulaIcon(true)`, "betterUI_spatula");
        }
        const [dropMatch, dropPlayerVar] = regex`(${v})\.ctsCapture\(\!1\)`.safeExec(src, ["betterChat_chatEvent_dropSpatula", "betterUI_spatula"]);
        if (dropMatch && dropPlayerVar) {
            if (chatEventFuncAdded) src = src.safeReplace(dropMatch, `(${dropMatch}, addChatEvent(ChatEvent.dropSpatula, ${dropPlayerVar}))`, "betterChat_chatEvent_dropSpatula");
            src = src.safeReplace(dropMatch, `${dropMatch}, ${dropPlayerVar}.showSpatulaIcon(false)`, "betterUI_spatula");
        }
    
        // SERVER and MOD Chat Icons
        const [,iconVar] = regex`(${v})\.classList\.add\(\"fab\"`.safeExec(src, "");
        if (iconVar) {
            const [,nameDivVar] = regex`(${v})\.style\.display\=\"inline-block\"(?:\r|\n|.)*\1\.style\.color\=\"#ff0\"`.safeExec(src, "");
            if (nameDivVar) {
                const chatIcon = `(${iconVar}.classList.add({CLASS}, "ss_marginright_xs", "chat-icon"), ${nameDivVar}.appendChild(${iconVar}))`
                src = src.safeReplace(`"SERVER: "`, `"SERVER: ",${chatIcon.replace("{CLASS}", `"far6", "fa-globe"`)}`, "");
                src = src.safeReplace(`"MOD: "`, `"MOD: ",${chatIcon.replace("{CLASS}", `"fas", "fa-shield-alt"`)}`, "");
            }
        }
    
        // First-Person Spectate Controls
        const updownKeybinds = `extern?.modSettingEnabled?.('specTweaks_updown')`;
        const spectateControls = "vueApp.settingsUi.controls.keyboard.spectate";
        src = src.safeReplace(`"ARROWUP"`, `((${updownKeybinds})? ${spectateControls}[${spectateControls}.findIndex(i => i.id === "ascend")].value : "ARROWUP")`, "");
        src = src.safeReplace(`"ARROWDOWN"`, `((${updownKeybinds}) ? ${spectateControls}[${spectateControls}.findIndex(i => i.id === "descend")].value : "ARROWDOWN")`, "");
        
        // Reconfigure playerAccount dateCreated (for badges) 
        const [,strDate, rawDate] = regex`(${v})\=new\sDate\((${v})\)\.toLocaleDateString`.safeExec(src, "");
        if (strDate && rawDate) src = src.safeReplace(`._dateCreated=${strDate}`, `._dateCreated=${rawDate}`, "");

        // Reconfigure playerAccount social (for badges)
        const [,socialVar] = regex`set\((${v})\)\s*\{[^{}]*this\._contentCreator\s*=\s*!0`.safeExec(src, "");
        if (socialVar) src = src.safeReplace(`this._contentCreator=!0`, `this._contentCreator=${socialVar}`, "");
        
        // Legacy Mode Inventory Icons
        const [,itemRendererVar] = regex`(${v})\.clearCanvas\(${v}\)`.safeExec(src, "legacyMode_skins");
        if (itemRendererVar) {
            const legacyIconFunction = `
                updateLegacyIcons: (enabled, meshName) => {
                    const key = enabled ? meshName + "_Legacy" : meshName.replace("_Legacy", "");
                    ${itemRendererVar}.meshRenderStaging[key] = ${itemRendererVar}.meshRenderStaging[meshName];
                }
            `;
            src = src.safeReplace("catalog:", `${legacyIconFunction},catalog:`, "legacyMode_skins");
        }

        // Fog Mode
        const [,fogScene, mapDataVar2] = regex`(${v})\.fogDensity\=(${v})\.fog\.density`.safeExec(src, "customFog");
        if (fogScene) {
            const [,fogModeVar] = regex`${escSymbols(fogScene)}\.fogMode\=(${v}\.FOGMODE_EXP2)`.safeExec(src, "customFog");
            const [,defaultFogColor] = regex`${escSymbols(fogScene)}\.fogColor\=(new\s${v}\(\s*\d*\.?\d+\s*,\s*\d*\.?\d+\s*,\s*\d*\.?\d+\s*,\s*\d*\.?\d+\s*\))`.safeExec(src, "customFog");
            if (fogScene && fogModeVar && fromHexStringFunc && defaultFogColor) {
                const fogColorFunc = `
                updateFog: (enabled = false, density = 0, hex="#ffffff") => {
                    if (!extern.inGame) return;
                    if (enabled) {
                        ${fogScene}.fogEnabled = true;
                        ${fogScene}.fogMode = ${fogModeVar};
                        ${fogScene}.fogColor = ${fromHexStringFunc}(hex);
                        ${fogScene}.fogDensity = density;
                    } else {
                        if (window.megaMod.customFog?.fog) {
                            if (window.megaMod.customFog.fog.density > 0) {
                                ${fogScene}.fogMode = ${fogModeVar};
                                ${fogScene}.fogColor = ${fromHexStringFunc}(window.megaMod.customFog.fog.color);
                                ${fogScene}.fogDensity = window.megaMod.customFog.fog.density;
                                ${fogScene}.fogEnabled = true;
                            } else {
                                ${fogScene}.fogEnabled = false;
                                ${fogScene}.fogDensity = 0;
                            }
                        } else {
                            ${fogScene}.fogMode = ${fogModeVar};
                            ${fogScene}.fogColor = ${defaultFogColor};
                            ${fogScene}.fogDensity = 0.01;
                        }
                    }
                    //window.megaMod.constructor.log("extern.updateFog() -", \`Enabled: \${enabled}\ | Density: \${${fogScene}.fogDensity} | Color: \${${fogScene}.fogColor}\`);
                }
                `;
                src = src.safeReplace("catalog:", `${fogColorFunc},catalog:`, "customFog");
            }
        }
        if (mapDataVar2) {
            const [mapInit] = regex`${escSymbols(mapDataVar2)}\.extents\.x\.min\=0`.safeExec(src, "customFog");
            if (mapInit) src = src.safeReplace(mapInit, `${mapInit},window.megaMod.customFog.initFog(${mapDataVar2}.fog)`, "customFog");
        }
        
        // UniqueID Fix
        const [uniqueIDMatch, uniqueIDPlayerVar] =  regex`playerName\:(${v})\.name`.safeExec(src, "");
        if (uniqueIDMatch && uniqueIDPlayerVar && uniqueIDVar) src = src.safeReplace(uniqueIDMatch, `${uniqueIDMatch}, uniqueId: ${uniqueIDPlayerVar}.${uniqueIDVar}`, ""); 
        
        // Set WatchPlayer 
        const [,watchplayerVar] = regex`(${v})\=parsedUrl\.query\.watchPlayer`.safeExec(src, "");
        if (watchplayerVar) src = src.safeReplace("catalog:", `setWatchPlayer: watchPlayer => ${watchplayerVar} = watchPlayer,catalog:`, "");

        // Set Observe 
        const [,observerVar] = regex`get\s+observingGame\s*\(\)\s*{\s*return\s+(${v})\s*;?\s*}`.safeExec(src, "");
        if (observerVar) src = src.safeReplace("catalog:", `setObserving: observing => ${observerVar} = observing,catalog:`, "");

        // Spectate-Only ESP
        const [,playerMeshVar] = regex`this\.(${v})\=${v}\(\"egg\"`.safeExec(src, "betterEggforce_specESP");
        if (playerMeshVar) {
            const [materialMatch, materialVar] = regex`this\.${escSymbols(playerMeshVar)}.(${v})\=${v}\(\"shell\"`.safeExec(src, "betterEggforce_specESP");
            if (materialMatch && materialVar) {
                src = src.safeReplace(
                    materialMatch, 
                    `window?.megaMod?.betterEggforce?.specESP && this.${playerMeshVar}.setRenderingGroupId(2),
                    ${materialMatch}`,
                     "betterEggforce_specESP"
                );
            }
            if (playerArr && actorVar && materialVar) {
                const espFunc = `
                    toggleSpecESP: enabled => {
                        //window.players = ${playerArr};
                        const messageLoc = enabled ? 'megaMod_specESP_enabled' : 'megaMod_specESP_disabled';
                        if (!vueApp.game.isPaused) vueApp.$refs.gameScreen.showInGameNotif(messageLoc);
                        
                        const modifyMesh = mesh => mesh.setRenderingGroupId(enabled ? 2 : 0);
                        ${playerArr}.forEach(player => {
                            if(!player) return;
                            modifyMesh(player.${actorVar}.${playerMeshVar});
                        });
                    }
                `;
                src = src.safeReplace("catalog:", `${espFunc},catalog:`, "betterEggforce_specESP");
            }
        }

        // Disable Chat Blacklist (Eggforcers)
        // ty A3+++
        const isEggforcer = "[2, 4, 8192].some(role => extern.adminRoles & role)";
        const blacklistDisabled = `(extern?.modSettingEnabled?.('betterEggforce_chatBlacklist') && ${isEggforcer})`
        const [filterMatch, filterFunc, filterMsg] = regex`!(${v})\((${v})\)\s*&&\s*\2\.indexOf\("<"\)`.safeExec(src, "betterEggforce_chatBlacklist");
        const [elemMatch, msgElem, msgContent] = regex`\)\),(${v})\.innerHTML=(${v}),`.safeExec(src, "betterEggforce_chatBlacklist");
        if (filterFunc && msgElem && msgContent) {
            const [,idVar] = regex`(${v})>253`.safeExec(src, "betterEggforce_chatBlacklist");
            src = src.safeReplace(filterMatch, filterMatch.replace(`!${filterFunc}(${filterMsg})`, `(${blacklistDisabled} || !${filterFunc}(${msgContent}))`), "betterEggforce_chatBlacklist");
            src = src.safeReplace(elemMatch, `${elemMatch}${filterFunc}(${msgContent}) && arguments[2] !== null ${idVar ? `&& ${idVar} < 253` : ''} && ${blacklistDisabled} && (${msgElem}.style.color="red") && (${msgElem}.innerHTML = window.megaMod.betterChat.highlightBlacklist(${msgElem}.innerHTML, ${filterFunc})),`, "betterEggforce_chatBlacklist");
        }
        
        // Auto Ban
        const [,packInt8] = regex`${v}\.(${v})\(${v}\.serverStateIdx\)`.safeExec(src, "betterEggforce_autoBan");
        const [,packString] = regex`${v}\.(${v})\(${v}\.${v}\.firebaseId\)`.safeExec(src, "betterEggforce_autoBan");
        const [,sendWS] = regex`${v}\.serialize\(\)\.(${v})\(${v}\)`.safeExec(src, "betterEggforce_autoBan");
        if (joinGameMatch && joinPlayerVar && uniqueIDVar && packInt8 && packString && sendWS) {
            const [banPlayerFunc, outBufferVar, uniqueId, reason, duration] = regex`var\s(${v})\s*\=\s*${v}\.getBuffer\(\);\s*\1\.${packInt8}\(${v}\.${v}\),\s*\1\.${packString}\((${v})\),\s*\1\.${packString}\((${v})\),\s*\1\.${packInt8}\((${v})\),\s*\1\.${sendWS}\(${v}\)`.safeExec(src, "betterEggforce_autoBan");
            if (banPlayerFunc && uniqueId && reason && duration) {
                const newBanPlayerFunc = `
                    const newBanPlayer = (uniqueId, reason, duration) => {
                        ${banPlayerFunc.replace(`(${uniqueId})`, "(uniqueId)").replace(`(${reason})`, "(reason)").replace(`(${duration})`, "(duration)")}
                    };
                `;
                const checkAutoBanFunc = `
                    const checkAutoBan = (player, autoBanList = window?.megaMod?.betterEggforce?.getAutoBanList?.()) => {
                        if (!(player && autoBanList)) return;

                        const nameMatch = autoBanList.includes(player.name);
                        const uniqueIdMatch = autoBanList.includes(player.${uniqueIDVar});
                        if (!(nameMatch || uniqueIdMatch)) return;

                        const banReason = "MegaMod Auto Ban" + (nameMatch ? \` (Name: \${player.name})\` : " (UniqueID)");
                        vueApp.$refs.gameScreen.showInGameNotif(vueApp.loc['megaMod_betterEggforce_autoBanned'].format(player.name));
                        newBanPlayer(player.${uniqueIDVar}, banReason, 2);
                        vueApp.$refs.gameScreen.addBan(player.name, player.${uniqueIDVar}, 2, banReason);
                        window.megaMod.constructor.log("checkAutoBan() -", \`Autobanned \${player.name} (\${player.${uniqueIDVar}})\`);
                    };
                `;
                src = src.safeReplace("window.BAWK", `${newBanPlayerFunc}${checkAutoBanFunc}window.BAWK`, "betterEggforce_autoBan");
                src = src.safeReplace(joinGameMatch, `if (!${joinPlayerVar}.ws && [2, 4, 8192].some(role => extern.adminRoles & role) && extern?.modSettingEnabled?.("betterEggforce_autoBan")) checkAutoBan(${joinPlayerVar});${joinGameMatch}`, "betterEggforce_autoBan");
                const autoBanUpdateFunc = `
                    checkAutoBans: list => {
                        ${playerArr}.forEach(player => {
                            if(!player) return;
                            checkAutoBan(player, list);
                        });
                    }
                `;
                src = src.safeReplace("catalog:", `${autoBanUpdateFunc},catalog:`, "betterEggforce_autoBan");
            }
        }

        // Kill Feed icons 
        const weaponIcon = `<svg class="weapon-icon"><use xlink:href="#\${GUNICON\}"></use></svg>`
        const weaponTemplateA = `PLAYER.meleeCountdown ? "ico-weapon-melee" : PLAYER.equipWeaponIdx ? "ico-weapon-cluck9mm" : WeaponIcons[PLAYER.charClass]`;
        const spatulaIcon = `<svg class="spatula-icon" style="display: \${PLAYER?.spatula && extern?.modSettingEnabled?.("betterUI_spatula") ? "inline-block" : "none"\};"><use xlink:href="#ico_spatula"></use></svg>`
        const feedMatches = Array.from(src.safeMatchAll(regex`((${v})\.name)\s*\+\s*"<\/span>"`, ["betterUI_weapons", "betterUI_distance"]));
        //const [,byPlayerVar] = regex`(${v})\.bestOverallStreak\)`.safeExec(src, "betterUI_weapons");
        if (feedMatches.length === 2) {
            const dmgTypeMatches = Array.from(src.safeMatchAll(regex`(?!this)\b(${v})\.lastDmgType\s*\=\s*${v}\,`, "betterUI_weapons")); 
            if (dmgTypeMatches.length == 2) {
                const [[,killedPlayer], [dmgTypeMatch, byPlayer]] = dmgTypeMatches;
                if (killedPlayer && dmgTypeMatch && byPlayer) {
                    const [killTxtFunc] = regex`(?<!\.)\b${v}\(${escSymbols(killedPlayer)}\s*\,\s*${escSymbols(byPlayer)}\)`.safeExec(src, "betterUI_weapons");
                    if (killTxtFunc) {
                        src = src.safeReplace(killTxtFunc, `(()=>{})()`, "betterUI_weapons");
                        src = src.safeReplace(dmgTypeMatch, `${dmgTypeMatch}${killTxtFunc},`, "betterUI_weapons");
                    }
                }
            }

            const [[,,playerA], [,,playerB]] = feedMatches;
            feedMatches.forEach(([match, name, player], idx) => {
                src = src.safeReplace(match, match.safeReplace(name, `(${player}?.spatula ? \`${spatulaIcon.replace("PLAYER", player)}\` : '') + ${name} + \`${weaponIcon.replace("GUNICON", idx ? weaponTemplateA.replaceAll("PLAYER", player) : `${playerB}.lastDmgType === 8 ? "ico-weapon-grenade" : ${playerB}.lastDmgType === 9 ? "ico-weapon-melee" : ${weaponTemplateA.replaceAll("PLAYER", player)}`)}\``, "betterUI_weapons"), "betterUI_weapons");
                //src = src.safeReplace(match, match.safeReplace(name, `${name} + \` ${weaponIcon.replace("GUNICON", weaponTemplateA.replaceAll("PLAYER", player))}\``, "betterUI_weapons"), "betterUI_weapons");
            });
            if (playerA && playerB) {
                // Kill Distance
                const [,xVar, yVar, zVar] = regex`\.copyFromFloats\(this\.${v}\.(${v})\,\s*this\.${v}\.(${v})\,\s*this\.${v}\.(${v})\)`.safeExec(src, "betterUI_distance");
                if (xVar && yVar && zVar) {
                    src = src.safeReplace(`+"<br>"`, `+ \` <span class="kill-dist">(\${Math.floor(Math.length3(${playerA}.${xVar}-${playerB}.${xVar}, ${playerA}.${yVar}-${playerB}.${yVar}, ${playerA}.${zVar}-${playerB}.${zVar})) || "<1"\}m)</span><br>\``, "betterUI_distance");
                }
            }
        }

        // Player List Icons
        let slotPlayerVar = null;
        const [slotMatch, slotVar] = regex`(${v}).classList\.add\(\"playerSlot--name\"\)`.safeExec(src, "betterUI_weapons");
        const weaponTemplateB = `vueApp.game.isPaused && PLAYER.ws ? WeaponIcons[extern.account.classIdx] : ${weaponTemplateA}`;
        if (slotMatch && slotVar) {
            const [nameMatch, playerVar] = regex`${escSymbols(slotVar)}\.innerText\s*\=\s*(${v}).name`.safeExec(src, ["betterUI_weapons", "betterUI_spatula"]);
            if (nameMatch && playerVar) {
                slotPlayerVar = playerVar;
                src = src.safeReplace(nameMatch, `${nameMatch}, (${slotVar}.innerHTML = \`${weaponIcon.replace("GUNICON", weaponTemplateB.replaceAll("PLAYER", playerVar))} \${${slotVar}.innerHTML\}\`)`, "betterUI_weapons");
            }
        }

        const [,scoreVar] = regex`this\.(${v})\s*\=\s*this\.stats\.streak`.safeExec(src, "");
        if (playerArr && scoreVar) {
            const [playerClassMatch, playerClassVar] = regex`(${v})\.prototype\.swapWeapon`.safeExec(src, "");
            if (playerClassMatch && playerClassVar) {
                src = src.safeReplace(playerClassMatch, `
                    ${playerClassVar}.prototype.getPlayerSlot = function() {
                        const playerSlots = [...document.querySelectorAll(".playerSlot")].filter(x => x.style.display === "block");
                        const redFirst = playerSlots?.length && playerSlots[0].querySelector(".playerSlot--name-score").className.includes("red");
                        const playerListIdx = [...${playerArr}.filter(Boolean)].sort((a, b) => a.team !== b.team ? redFirst ? b.team - a.team : a.team - b.team :  b.${scoreVar} - a.${scoreVar}).findIndex(player => player.id === this.id); 
                        if (playerSlots?.length && playerListIdx != null) return playerSlots[playerListIdx];
                    },
                    ${playerClassVar}.prototype.setWeaponIcon = function(icon) {
                        const playerSlot = this.getPlayerSlot();
                        if (!playerSlot) return;
                        const iconElem = playerSlot.querySelector(".weapon-icon");
                        if (!iconElem) return;
                        iconElem.classList.add('fade');
                        setTimeout(() => {
                            const useElem = iconElem.querySelector('use');
                            if (useElem) useElem.setAttribute("xlink:href", icon || \`#\${${weaponTemplateA.replaceAll("PLAYER", "this")}}\`);
                            iconElem.classList.remove('fade');
                        }, 150);
                    },
                    ${playerClassVar}.prototype.showMeleeIcon = function() {
                        this.setWeaponIcon("#ico-weapon-melee");
                        if (this?.iconTimeout) clearTimeout(this.iconTimeout);
                        this.iconTimeout = setTimeout(this.setWeaponIcon.bind(this), (1000/30)*17);
                    },
                    ${playerClassVar}.prototype.showSpatulaIcon = function(picked=false) {
                        this.spatula = picked;
                        const playerSlot = this.getPlayerSlot();
                        if (!playerSlot) return;
                        const spatIcon = playerSlot.querySelector(".spatula-icon");
                        if (spatIcon) spatIcon.style.display = this.spatula && extern?.modSettingEnabled?.("betterUI_spatula") ? "inline-block" : "none";
                        const nameScore = playerSlot.querySelector(".playerSlot--name-score");
                        if (nameScore) {
                            if (this.spatula) nameScore.classList.add("playerSlot-spatula");
                            else nameScore.classList.remove("playerSlot-spatula");
                        }
                    },${playerClassMatch}`, 
                "");

                // Pistol Swap
                const [swapWeaponMatch] = regex`this\.equipWeaponIdx\s*=\s*${v}\,`.safeExec(src, "");
                if (swapWeaponMatch) src = src.safeReplace(swapWeaponMatch, `${swapWeaponMatch}this.setWeaponIcon(),`, "");

                // Melee (Me)
                const [meleeMatch] = regex`this\.${v}\.melee\(\)`.safeExec(src, "");
                if (meleeMatch) src = src.safeReplace(meleeMatch, `${meleeMatch},this.showMeleeIcon()`, "");
                
                // Melee (Them)
                if (playerArr) {
                    const [meleeMatch, meleePlayer] = regex`(${escSymbols(playerArr)}\[${v}\])\.${v}\.melee\(\)`.safeExec(src, "");
                    if (meleeMatch && meleePlayer) src = src.safeReplace(meleeMatch, `${meleeMatch},${meleePlayer}.showMeleeIcon()`);
                }
            }
        }

        // Player List Spatula Icon
        if (slotPlayerVar) {
            const [,iconDiv] = regex`(${v})\.classList\.add\(\"playerSlot--icons\"\)`.safeExec(src, "betterUI_spatula");
            if (iconDiv) {
                const [iconMatch] = regex`${escSymbols(iconDiv)}\.innerText\s*\=\s*\"\"`.safeExec(src, "betterUI_spatula");
                if (iconMatch) src = src.safeReplace(iconMatch, `${iconMatch},${iconDiv}.insertAdjacentHTML('beforeend', \`${spatulaIcon.replace("PLAYER", slotPlayerVar)}\`)`, "betterUI_spatula");
            }
        }

        // Player Slot Spatula Styling
        const spatulaMatches = Array.from(src.safeMatchAll(regex`(${v})\.team\]\}\``));
        spatulaMatches.forEach(([match, player]) => {
            src = src.safeReplace(match, `${match.replace("`", "")} \$\{${player}?.spatula ? "playerSlot-spatula" : ""}\``);
        });

        // Spatula Init
        if (playerArr) {
            const [spatInitMatch, spatInitPlayer] = regex`${v}\.${v}\.capture\((${escSymbols(playerArr)}\[${v}\])\)`.safeExec(src, "");
            if (spatInitMatch && spatInitPlayer) src = src.safeReplace(spatInitMatch, `${spatInitMatch}, ${spatInitPlayer}?.showSpatulaIcon(true)`, "");
        }
        
        // All done - yay! :)
        this.setSourceModified(true);
        return src;
    }

    static log(message, ...details) {
        if (!this.debug) return;
        
        console.log(
            "%c%s%c%s",
            `color: #0a1633; font-weight: bold; background: #1795d2; padding: 2px 6px; border-radius: 5px; margin-right: 5px;`,
            `The MegaMod 🛠️`,
            "font-weight: bold;",
            message || "",
            ...details
        );
    }

    static error(message, ...details) {
        if (!this.debug) return;
        
        console.error(
            "%c%s%c%s",
            `color: #0a1633; font-weight: bold; background: #1795d2; padding: 2px 6px; border-radius: 5px; margin-right: 5px;`,
            `The MegaMod 🛠️`,
            "font-weight: bold;",
            message || "",
            ...details, 
        );
    }

    static async fetchJSON(subPath) {
        this.log("Fetching JSON:", subPath);

        if (!subPath.startsWith('http')) subPath = `${rawPath}${subPath}`;
        const res = await fetch(subPath);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
        return await res.json();
    }

    static async fetchCSS(subPath) {
        this.log("Fetching CSS:", subPath);

        if (!subPath.startsWith('http')) subPath = `${rawPath}${subPath}`;
        const res = await fetch(subPath);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
        return await res.text();
    }

    static createFocusTimer(checkInterval, requiredTime, callbackFunc) {
        let focusTime = 0;
        const focusTimer = setInterval(() => {
            if (document.hasFocus()) {
                focusTime += checkInterval;
                if (focusTime >= requiredTime) {
                    clearInterval(focusTimer);
                    callbackFunc();
                }
            }
        }, checkInterval);
    }

    static sendChatMessage(message) {
        const chatElem = document.getElementById('chatIn');
        if (chatElem && unsafeWindow.extern.startChat) {
            unsafeWindow.extern.startChat();
            chatElem.value = message;
            chatElem.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        }
    }

    static getRandomHex() {
        return `#${(Math.random() * 0xfffff * 1000000).toString(16).slice(0, 6)}`;
    }

    static addModCSS(filename) {
        const preload = extern.modSettingEnabled("megaMod_cssPreload");
        const url = `/mods/css/${filename}.css`;
        const style = document.createElement(preload ? 'style' : 'link');
        document.body.appendChild(style);
        if (preload) {
            MegaMod.fetchCSS(url).then(css => style.textContent = css);
        } else {
            Object.assign(style, { rel: 'stylesheet', href: (cdnPath + url) });
        }
        return style;
    }

    static getModNames(arr) {
        const getModName = (id) => {
            const findTopmostLocKey = (arr, id) => {
                for (const obj of arr) {
                    if (containsId(obj, id)) {
                        return obj.locKey;
                    }
                }
                return null;
            };

            const containsId = (obj, targetId) => {
                if (obj.id === targetId) return true;
                if (obj.settings) {
                    for (const child of obj.settings) {
                        if (containsId(child, targetId)) return true;
                    }
                }
                return false;
            };

            const findExactLocKey = (arr, id) => {
                for (const obj of arr) {
                    if (obj.id === id && obj.locKey) {
                        return obj.locKey;
                    }
                    if (obj.settings) {
                        const result = findExactLocKey(obj.settings, id);
                        if (result) return result;
                    }
                }
                return null;
            };

            const outerLocKey = findTopmostLocKey(vueApp.settingsUi.modSettings, id);
            const exactLocKey = findExactLocKey(vueApp.settingsUi.modSettings, id);

            if (!outerLocKey || !exactLocKey) return id;

            const outerTitle = vueData.loc[`${outerLocKey}_title`] || outerLocKey;
            const specific = vueData.loc[exactLocKey] || exactLocKey;

            return outerLocKey === exactLocKey ? outerTitle : `[${outerTitle}] ${specific}`;
        };

        return [...new Set(arr.map(id => getModName(id)))].sort((a, b) => {
            const getFirstLetter = s => (s.match(/[a-zA-Z0-9]|\S/) || [''])[0].toLowerCase();
            return getFirstLetter(a).localeCompare(getFirstLetter(b));
        });
    };

    constructor() {
        if (localStorage.getItem(MegaMod.KEYS.ErrVersion) === null) MegaMod.addPopups();
        MegaMod.addLoadLogo();
        this.regexErrs = [];
        this.modConflicts = [];
        // This doesn't work 100% of the time >:(
        switch(document.readyState) {
            case "loading": 
                document.addEventListener("DOMContentLoaded", this.start.bind(this));
                break;
            case "interactive": 
            case "complete": 
                this.start();
                break;
            default:
                window.addEventListener("load", this.start.bind(this));
                break;
        }

        // Add separators to number
        Number.prototype.addSeparators = function() {
            return extern?.modSettingEnabled?.('betterUI_ui') ? this.toLocaleString() : this;
        };

        MegaMod.log("Debug:", MegaMod.debug);
        MegaMod.log("Local:", MegaMod.local);
    }

    addRegexErrId(id) {
        if (!id) return;
        this.regexErrs.push(id);
        MegaMod.log("Mod Error:", id);
    }

    addModConflictId(id) {
        if (!id) return;
        this.modConflicts.push(id);
        MegaMod.log("Mod Conflict:", id);
    }

    setModLoc(callback) {
        MegaMod.log("setModLoc() -", "Setting mod loc");

		Object.assign(vueData.loc, this.loc);
		vueData.loc.megaMod_betterUI_mapPopup_desc = vueData.loc.megaMod_betterUI_mapPopup_desc.format(vueData.maps.filter(m => m.availability === "both").length);
        if (callback) callback();
	}
    
	extractSettings(mods) {
		return mods.flatMap(mod => {
			const settings = (mod.type !== SettingType.Group) ? [mod] : [];
			if (mod.settings) settings.push(...this.extractSettings(mod.settings));
			return settings;
		});
	}

	getModSettingById(id) {
		return this.extractSettings(vueApp?.settingsUi?.modSettings || []).find(setting => setting.id === id);
	}

	isModSetting(id) {
		return this.getModSettingById(id) != null;
	}

	updateModSetting(id, value) {
		const setting = this.getModSettingById(id);
		if (setting) setting.value = value;
		const origSetting = this.extractSettings(vueApp.$refs.settings?.originalSettings?.modSettings || []).find(m => m.id === id);
		if (origSetting) origSetting.value = value;
		localStore.setItem(id, typeof value === "string" ? value : JSON.stringify(value));
	}

	newTogglerFunc(id, value) {
		if (this.isModSetting(id)) this.updateModSetting(id, value);
		const settingEnabled = this.modSettingEnabled(id);
		switch (id) {
			case 'hideHUD':
				if (!value) this.hideHUD.disableHideHUD();
				vueApp.$refs.gameScreen.updateSpectateControls();
				break;
			case 'legacyMode':
				this.legacyMode.switchLegacySkins(this.modSettingEnabled("legacyMode_skins"));
				this.legacyMode.switchLegacySounds(this.modSettingEnabled("legacyMode_sfx"));
				break;
			case 'legacyMode_skins':
				if (this.modSettingEnabled("legacyMode")) this.legacyMode.switchLegacySkins(value);
				break;
			case 'legacyMode_sfx':
				if (this.modSettingEnabled("legacyMode")) {
					this.legacyMode.switchLegacySounds(settingEnabled);
					BAWK.play(settingEnabled ? "ammo_Legacy" : "ammo");
				}
				break;
			case 'changeFPS':
				if (value) {
					this.changeFPS.enableFPS();
				} else {
					this.changeFPS.disableFPS();
				}
				break;
			case 'matchGrenades':
				if (extern.inGame) extern?.tryUpdateGrenades?.();
				break;
			case 'colorSlider':
				if (!value) extern.setShellColor(0);
				else if (this.modSettingEnabled("colorSlider_autoSave")) extern.useSliderColor();
				this.colorSlider.refreshColorSelect();
				break;
			case 'colorSlider_unlock':
				if (!value && !vueApp.isUpgraded) extern.setShellColor(0);
				else if (this.modSettingEnabled("colorSlider_autoSave")) extern.useSliderColor();
				break;
			case 'colorSlider_randomizer':
				extern.setShellColor(vueApp.equip.colorIdx);
				this.colorSlider.refreshColorSelect();
				break;
			case 'betterUI':
				this.betterUI.switchBetterUI();
				break;
			case 'betterUI_ui':
				this.betterUI.switchUITweaks(settingEnabled);
				break;
			case 'betterUI_inventory':
				this.betterUI.switchBetterInv(settingEnabled);
				break;
			case 'betterUI_profile':
				this.betterUI.refreshProfileScreen();
				break;
			case 'betterUI_roundness':
				this.betterUI.switchRoundness(settingEnabled);
				break
			case 'betterUI_colors':
				this.betterUI.switchColored(settingEnabled);
				break;
            case 'betterUI_chlg':
				this.betterUI.switchChlg(settingEnabled);
				break;
            case 'betterUI_weapons':
				this.betterUI.switchWeapons(settingEnabled);
				break;
            case 'betterUI_distance':
				this.betterUI.switchDistance(settingEnabled);
                break;
            case 'betterUI_spatula':
				this.betterUI.switchSpatula(settingEnabled);
                break;
			case 'betterUI_hitMarkers':
				if (extern.inGame) extern?.switchHitMarkerColor?.(settingEnabled);
				break;
			case 'betterChat':
				this.betterChat.switchBetterChat();
				break;
            case 'betterChat_chatIcons':
				this.betterChat.switchChatIcons(settingEnabled);
				break;
            case "betterChat_longerChat":
                this.betterChat.switchLongerChat(settingEnabled);
                break;
            case "betterChat_infChat":
                this.betterChat.switchInfChat(settingEnabled);
                break;
            case "betterChat_chatEvents":
                this.betterChat.switchChatEvents();
                break;
			case 'specTweaks':
			case 'specTweaks_updown':
				vueApp.$refs.gameScreen.updateSpectateControls();
				break;
			case 'themeManager':
				document.getElementById(`themeCSS-${this.getModSettingById("themeManager_themeSelect").value}`).disabled = !value;
				break;
			case 'customSkybox':
				extern?.updateSkybox?.(
                    value, 
                    this.getModSettingById('customSkybox_color').value
                );
				break;
            case 'customFog':
                extern.updateFog(
                    value, 
                    this.getModSettingById('customFog_density').value / 100, 
                    this.getModSettingById('customFog_color').value
                );
                break;
            case "betterEggforce":
                this.betterEggforce.updatePlayPanel();
                vueApp.$refs.gameScreen.updateSpectateControls();
                if (extern.inGame && extern.modSettingEnabled("betterEggforce_autoBan")) extern?.checkAutoBans?.();
                break;
            case "betterEggforce_specESP":
                    vueApp.$refs.gameScreen.updateSpectateControls();
                    break;
            case "betterEggforce_banHistory":
                this.betterEggforce.updatePlayPanel();
                break;
            case "betterEggforce_autoBan":
                if (extern.inGame && settingEnabled) extern?.checkAutoBans?.();
                break;
            case "customCrosshair":
                this.customCrosshair.getCrosshairTypes().forEach(type => this.customCrosshair.enableCrosshairStyle(type, extern.modSettingEnabled(`${this.customCrosshair.getBaseSetting(type)}_enabled`)));
                break;
		}
		if (id.startsWith("hideHUD_")) this.hideHUD.disableHideHUD();
		if (id.startsWith("legacyMode_sfx_")) this.legacyMode.switchLegacySounds(this.modSettingEnabled("legacyMode"));
		if (id.startsWith("betterChat_chatEvent_")) {
			const types = Object.keys(ChatEventData).filter(k => ChatEventData[k].setting === id);
			types.forEach(type => this.betterChat.switchChatEvent(type, settingEnabled));
		}
        if (id.startsWith("customCrosshair_")) {
            const [, enableType] = /customCrosshair\_([a-zA-Z]+)\_enabled/.exec(id) || [];
            if (enableType) this.customCrosshair.enableCrosshairStyle(enableType, settingEnabled);
            const [, type, attr] = /customCrosshair\_([a-zA-Z]+)\_([a-zA-Z]+)\_enabled/.exec(id) || [];
            if (type && attr) this.customCrosshair.setAttr(type, attr);
        }
		vueApp.$refs.settings.checkReloadNeeded();
	}

	newAdjusterFunc(id, value) {
		if (this.isModSetting(id)) this.updateModSetting(id, parseInt(value));
		switch (id) {
			case "changeFPS_slider":
				this.changeFPS.setFPS(value);
				break;
		}
	}

    onSliderInput(id, value) {
        if (this.isModSetting(id)) this.updateModSetting(id, parseInt(value));
        switch (id) {
            case "customFog_density":
                extern?.updateFog?.(
                    this.modSettingEnabled("customFog"),
                    value / 100, 
                    this.getModSettingById('customFog_color').value, 
                );
                break;
		}
        const [, type, attr] = /customCrosshair\_([a-zA-Z]+)\_([a-zA-Z]+)/.exec(id) || [];
        if (type && attr) this.customCrosshair.setAttr(type, attr, value);
    }

	newKeybindFunc(id, value) {
		if (this.isModSetting(id)) this.updateModSetting(id, value.toUpperCase());
		switch (id) {
			case "ascend":
			case "descend":
			case "toggle_freecam":
			case "hideHUD_keybind":
			case "specTweaks_freezeKeybind":
            case "betterEggforce_specESP_keybind":
				vueApp.$refs.gameScreen.updateSpectateControls();
				break;
		}
	}

	newSelectFunc(id, value) {
		if (this.isModSetting(id)) this.updateModSetting(id, value);
        const settingEnabled = this.modSettingEnabled(id);
		switch (id) {
			case 'themeManager_themeSelect':
				this.customTheme.onThemeChanged(settingEnabled, value);
				break;
			case 'customSkybox_skyboxCategorySelect':
				this.customSkybox.onSkyboxCategoryChanged(value);
				break;
			case 'customSkybox_skyboxSelect':
				extern?.updateSkybox?.(settingEnabled);
                this.customSkybox.updateSkyboxPreview();
				break;
            case 'customCrosshair_crosshairSelect':
                if (value == "scope") {
                    this.customCrosshair.setScopeDesc();
                    this.customCrosshair.updateScopePreview();
                }
                break;
            case 'customCrosshair_scope':
                this.customCrosshair.onScopeChanged(value);
                break;
		}
	}

    newColorPickerFunc(id, value) {
        if (this.isModSetting(id)) this.updateModSetting(id, value);
        const settingEnabled = this.modSettingEnabled(id);
		switch (id) {
            case 'customSkybox_color':
                extern?.updateSkybox?.(settingEnabled, value);
                break;
			case 'customFog_color':
				extern?.updateFog?.(
                    settingEnabled,
                    this.getModSettingById('customFog_density').value / 100, 
                    value, 
                );
				break;
        }
        if (id.startsWith("customCrosshair_")) {
            const [, type, attr] = /customCrosshair\_([a-zA-Z]+)\_([a-zA-Z]+)/.exec(id) || [];
            if (type && attr) this.customCrosshair.setAttr(type, attr, value);
        }
    }

    newTagInputFunc(id, value) {
        const oldValue = this.getModSettingById(id)?.value;
        if (this.isModSetting(id)) this.updateModSetting(id, value);
        switch (id) {
            case "betterEggforce_autoBan_list":
                if (!(extern.inGame && extern.modSettingEnabled("betterEggforce_autoBan"))) break;
                const newValues = value.filter(item => !oldValue.includes(item));
                if (newValues?.length) extern?.checkAutoBans?.(newValues);
                break;
        }
    }

    addSettingsHooks() {
        MegaMod.log("addSettingsHooks() -", "Adding settings hooks");

        const oldLocFunc = vueApp.setLocData;
        vueApp.setLocData = function(...args) {
            oldLocFunc.apply(this, args);
            unsafeWindow.megaMod.setModLoc();
        };
        const { 
            onSettingToggled: oldTogglerFunc, 
            onSettingAdjusted: oldAdjusterFunc, 
            onControlCaptured: oldKeybindFunc
        } = vueApp.$refs.settings;
        Object.assign(vueApp.$refs.settings, {
            onSettingToggled(id, value) {
                oldTogglerFunc.call(this, id, value);
                unsafeWindow.megaMod.newTogglerFunc(id, value);
            },
            onSettingAdjusted(id, value) {
                oldAdjusterFunc.call(this, id, value);
                unsafeWindow.megaMod.newAdjusterFunc(id, value);
            },
            onSliderInput(id, value) {
                unsafeWindow.megaMod.onSliderInput(id, value);
            },
            onControlCaptured(controls, id, value) {
                oldKeybindFunc.call(this, controls, id, value);
                unsafeWindow.megaMod.newKeybindFunc(id, value);
            },
            onSelectChanged(id, value) {
                BAWK.play("ui_onchange");
                unsafeWindow.megaMod.newSelectFunc(id, value);
                this.updateSettingTab();
            },
            onColorPickerInput(id, value) {
                unsafeWindow.megaMod.newColorPickerFunc(id, value);
            },
            onTagInputUpdate(id, value) {
                unsafeWindow.megaMod.newTagInputFunc(id, value);
            }
        });
    }

    addKeydownEL() {
        MegaMod.log("addKeydownEL() -", "Adding keydown EventListener");
        const checkErrs = (ids) => ids.some(settingId => this.modErrs.includes(settingId));
        const hideHUDErr = checkErrs(["hideHUD", "hideHUD_keybind"]);
        const freezeErr = checkErrs(["specTweaks", "specTweaks_freezeKeybind"]);
        //const ksInfoErr = checkErrs(["killstreakInfo", "killstreakInfo_keybind"]);
        const espErr = checkErrs(["betterEggForce", "betterEggforce_specESP", "betterEggforce_specESP_keybind"]);
        document.addEventListener('keydown', (e) => {
            const modsDisabled = !(extern.modSettingEnabled("hideHUD") || extern.modSettingEnabled("killstreakInfo") || extern.modSettingEnabled("specTweaks"));
            if (document.activeElement.tagName === "INPUT" || !extern.inGame || vueApp.game.isPaused || modsDisabled) {
                if (!hideHUDErr && extern.modSettingEnabled("hideHUD")) this.hideHUD.disableHideHUD();
                /*
                if (!ksInfoErr && extern.modSettingEnabled("killstreakInfo")) {
                    // TODO: hide KSInfo Popup
                }
                */
                return;
            };
            const hideKey = unsafeWindow.megaMod.getModSettingById("hideHUD_keybind")?.value.toLowerCase();
            const freezeKey = unsafeWindow.megaMod.getModSettingById("specTweaks_freezeKeybind")?.value.toLowerCase();
            const espKey = unsafeWindow.megaMod.getModSettingById("betterEggforce_specESP_keybind")?.value.toLowerCase();
            //const ksKey = this.getModSettingById("killstreakInfo_keybind")?.value.toLowerCase();
            switch (e.key.toLowerCase()) {
                case hideKey:
                    if (!hideHUDErr && extern.modSettingEnabled("hideHUD") && !vueApp.game.isPaused) this.hideHUD.toggleHideHUD();
                    break;
                /*
                case ksKey:
                    // TODO: toggle KSInfo Popup
                    if (ksInfoErr || !extern.modSettingEnabled("killstreakInfo")) break;
                    break;
                */
                case freezeKey:
                    if (!freezeErr && extern.modSettingEnabled("specTweaks") && vueApp.ui.game.spectate) this.spectateTweaks.toggleFreezeFrame();
                    break;
                
                case espKey:
                    // TODO: toggle Spectate ESP
                    if (!espErr && extern.modSettingEnabled("betterEggforce_specESP") && vueApp.ui.game.spectate) this.betterEggforce?.toggleSpecESP?.();
                    break;
            }
        });
    }

    modSettingEnabled(id, ignoreParent) {
        const setting = this.getModSettingById(id);
        const parent = this.getModSettingById(setting?.parentId);
        //console.log(id, setting?.value, setting?.parentId, parent?.value); // uh oh lots of settings being checked :(
        return !this.modErrs.includes(id) 
            && (setting?.value ?? false) && (!setting?.disabled ?? false) 
            && (ignoreParent || (parent?.value ?? true) && (!parent?.disabled ?? true));
    }

    addExternFuncs() {
        MegaMod.log("addExternFuncs() -", "Adding extern functions");

        Object.assign(extern, {
            modSettingEnabled: this.modSettingEnabled.bind(this),
            isEggforcer() {
                return [2, 4, 8192].some(role => this.adminRoles & role);
            }
        });
    }

    addSounds(soundData) {
        MegaMod.log("addSounds()", `Adding ${soundData.length} sounds: ${soundData.join(", ")}`);

        const soundsInterval = setInterval(() => {
            const sounds = Object.values(BAWK?.sounds || {});
            if (!sounds.length || !sounds[0]?.buffer) return;
            clearInterval(soundsInterval);
            soundData.forEach(sfx => BAWK.loadSound(`${rawPath}/sfx/megaMod/${sfx}.mp3`, sfx));
        }, 250);
    }

    addChangelog() {
        MegaMod.log("addChangelog() -", "Adding changelog");
        Object.assign(vueApp, {
            showChangelogPopup(isMegaMod = false) {
                this.changelog.isMegaMod = isMegaMod;
                this.$refs.changelogPopup.show();
            },
            showMegaModTab(changelogOpen = false) {
                if (changelogOpen) vueApp.hideChangelogPopup();
                vueApp.showSettingsPopup();
                vueApp.$refs.settings.switchTab('mod_button');
            },
            showHistoryChangelogPopup(isMegaMod = false) {
                const processChangelog = (logs, target) => {
                    logs.forEach(log => {
                        const content = this.changelogSetup(log);
                        log.content.length = 0;
                        log.content.push(...content);
                        target.push(log);
                    });
                };
                
                if (isMegaMod) {
                    MegaMod.fetchJSON('/data/oldChangelog.json')
                        .then(data => processChangelog(data, this.changelog.megaMod.current));
                    this.changelog.showMegaModHistoryBtn = false;
                } else {
                    fetch('./changelog/oldChangelog.json', { cache: "no-cache" })
                        .then(response => response.json())
                        .then(data => processChangelog(data, this.changelog.current));
                    this.changelog.showHistoryBtn = false;
                }
            }
        });
    }

    setMapSkybox(skybox) {
        if (this.customSkybox) this.customSkybox.setMapSkybox(skybox);
    }

    addAllModFunctions() {
        MegaMod.log("addAllModFunctions() -", "Adding all mod functions");

        const mods = [
            { id: "specTweaks",     propKey: "spectateTweaks",    constructor: SpectateTweaks },
            { id: "killstreakInfo", propKey: "killstreakStats",   constructor: KillstreakStats },
            { id: "pbSpin",         propKey: "photoboothEggSpin", constructor: PhotoboothEggSpin },
            { id: "matchGrenades",  constructor: MatchGrenades },
            { id: "changeFPS",      constructor: ChangeFPS },
            { id: "colorSlider",    constructor: ColorSlider },
            { id: "customFog",      constructor: CustomFog },
            { id: "betterChat",     constructor: BetterChat },
        ];

        for (const { id, constructor, propKey = id } of mods) {
            if (!this.modErrs.includes(id)) this[propKey] = new constructor();
        }
        
        const dataFiles = [
            { 
                path: '/mods/data/inventory', 
                mod: 'betterUI', 
                callback: data => this.betterUI = new BetterUI(data)
            },
            { 
                path: '/data/sfx', 
                mod: null, 
                callback: data => this.addSounds(data)
            },
            { 
                path: '/mods/data/legacyMode', 
                mod: 'legacyMode', 
                callback: data => this.legacyMode = new LegacyMode(data)
            },
            { 
                path: '/mods/data/hideHUD', 
                mod: 'hideHUD', 
                callback: data => this.hideHUD = new HideHUD(data)
            },
            { 
                path: '/mods/data/skyboxes', 
                mod: 'customSkybox', 
                callback: data => this.customSkybox = new CustomSkybox(data)
            },
            { 
                path: '/mods/data/eggforce', 
                mod: 'betterEggforce', 
                callback: data => this.betterEggforce = new BetterEggforce(data)
            },
            { 
                path: '/mods/data/scopes', 
                mod: 'customCrosshair', 
                callback: data => this.customCrosshair = new CustomCrosshair(data)
            }
        ];
        
        const fetchFiles = dataFiles.filter(dataFile => !this.modErrs.includes(dataFile.mod));
        Promise.all(fetchFiles.map(dataFile => 
            MegaMod.fetchJSON(`${dataFile.path}.json`).then(data => dataFile.callback(data))
        )).then(() => this.addKeydownEL());
        
    }

    checkModErrors() {
        MegaMod.log("checkModErrors() -", "Checking mod errors");

        const checkDefined = (vars) => vars.some(variable => { 
            try { 
                return typeof eval(variable) !== 'undefined'; 
            } catch { 
                return false; 
            }
        });
    
        // Better Inventory
        const betterInvEnabled = checkDefined(["makeVueChanges", "setupItemTags", "itemData", "window.mySkins", "setMySkins", "window.randomizeSkin", "checkScriptErrors", "initBetterInventory"]);
        if (betterInvEnabled) this.modConflicts.push("betterUI");
        
        // VIP Color Slider 
        const sliderEnabled = checkDefined(["colorTemplate", "hueToHex", "hslToRgb", "rgbToHex", "updateColor", "sliderClick", "updateSliderLock"]);
        if (sliderEnabled) this.modConflicts.push("colorSlider");
    
        // Legacy Mode
        const legacyModeEnabled = checkDefined(["legacyBasicInterval", "sounds", "window.switchSounds", "legacyInitInterval"]);
        if (legacyModeEnabled) this.modConflicts.push("legacyMode");
    
        // Hide HUD
        const hideHUDEnabled = checkDefined(["elemIds", "hideHUDInterval"]);
        if (hideHUDEnabled) this.modConflicts.push("hideHUD");
    
        // Speedrun Timer
        const timerEnabled = checkDefined(["tickerStyle", "timerInitInterval"]);
        if (timerEnabled) this.modConflicts.push("killstreakInfo_timer");

        this.modErrs = this.regexErrs.concat(this.modConflicts);

        this.extractSettings(vueApp.settingsUi.modSettings).forEach(setting => {
            const errorKey = `${setting.id}_isError`;
            const settingError = this.modErrs.includes(setting.id);
            if (settingError) {
                setting.active = false;
                if (setting.type === SettingType.Toggler) this.updateModSetting(setting.id, setting.safeVal || false);
            } else if (localStore.getBoolItem(errorKey)) {
                if (setting.type === SettingType.Toggler) this.updateModSetting(setting.id, setting.defaultVal);
            }
            localStore.setItem(errorKey, settingError);
        });
    }

    checkForUpdate(updateContent) {
        MegaMod.log("checkForUpdate() -", "Checking if update available for The MegaMod");

        fetch(`${cdnPath}/js/script.meta.js`, { cache: 'no-cache' })
            .then(res => res.text())
            .then(meta => {
                const remoteVersion = /@version\s+([^\s]+)/.exec(meta)?.[1];
                const localVersion = GM_info.script.version;
                MegaMod.log("Current (Local) Version:", localVersion);
                MegaMod.log("Latest (Remote) Version:", remoteVersion);
                if (remoteVersion !== localVersion) {
                    if (MegaMod.fatalErr) {
                        if (confirm("There was a fatal error while starting The MegaMod.\n\nPlease click \"Ok\" to install the latest update to fix The MegaMod.")) {
                            localStore.setItem(MegaMod.KEYS.Updated, true);
                            unsafeWindow.openUpdate();
                        }
                    } else {
                        vueData.modUpdatePopupContent = vueData.loc['megaMod_updatePopup_desc'].format(remoteVersion);
                        vueApp.$refs.modUpdatePopup.show();
                    }
                    localStore.setItem(MegaMod.KEYS.Updated, true);
                } else {
                    if (localStore.getBoolItem(MegaMod.KEYS.Updated)) {
                        if (MegaMod.fatalErr) {
                            localStore.removeItem(MegaMod.KEYS.ErrVersion);
                            localStore.setItem(MegaMod.KEYS.ErrReloads, 0);
                            window.location.reload();
                        } else {
                            vueData.modUpdatedPopupContent = vueData.loc['megaMod_updatedPopup_desc'].format(localVersion);
                            vueData.updateContent = updateContent;
                            vueApp.$refs.modUpdatedPopup.show();
                        }
                        localStore.removeItem(MegaMod.KEYS.Updated);
                    } else if (MegaMod.fatalErr) {
                        alert("A fatal error occurred while starting the MegaMod!\n\nThis requires a new update, which hasn't been released yet.\n\nThe MegaMod is disabled but will continue to check for updates in the background.");
                    }
                }
            });
    }

    checkForAnnouncement(announcement) {
        if (!announcement) return;
        vueData.modAnnouncement = announcement;
        vueApp.$refs.modAnnouncementPopup.show();
    }

    tryShowModErrorPopups() {
        MegaMod.log("tryShowModErrorPopups() -", "Checking whether to show Mod Error popups");
        if (this.regexErrs.length || !MegaMod.sourceModified) {
            vueData.modErrsPopupContent = this.regexErrs.length ? vueData.loc['megaMod_modErrsPopup_desc_1'].format(MegaMod.getModNames(this.regexErrs).join("<br>")) : vueData.loc['megaMod_modErrsPopup_desc_2'];
            vueApp.$refs.modErrsPopup.show();
        }
        if (this.modConflicts.length) {
            vueData.disableModsPopupContent = vueData.loc['megaMod_disableModsPopup_desc'].format(MegaMod.getModNames(this.modConflicts).join("<br>"));
            vueApp.$refs.disableModsPopup.show();
        }
    }

    importLibs() {
        MegaMod.log("importLibs() -", "Importing libraries");

        // Import Library for sortable tables
        document.head.appendChild(Object.assign(document.createElement('link'), { 
            rel: 'stylesheet', 
            href: `${cdnPath}/libs/sortable/sortable.min.css` 
        }));
        document.head.appendChild(Object.assign(document.createElement('script'), { 
            src: `${cdnPath}/libs/sortable/sortable.min.js`
        }));
        // GIF Library
        document.head.appendChild(Object.assign(document.createElement('script'), { 
            src: `https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js`
        }));
    }

    checkInfo() {
        MegaMod.fetchJSON('/data/info.json').then(data => {
            const { updateInfo, currentChangelog } = data;
            (vueData.changelog.megaMod ??= {}).current = [currentChangelog];
            this.checkForUpdate({ updateInfo, currentChangelog });
            if (!MegaMod.fatalErr) this.checkForAnnouncement(data.announcement);
        });
    }

    init(settings) {
        vueData.settingsUi.modSettings = settings;
        this.setModLoc();
        this.checkModErrors();
        this.checkInfo();
        this.addChangelog();
        this.importLibs();
        MegaMod.fetchJSON('/mods/data/themes.json').then(data => {
            if (!this.modErrs.includes("themeManager")) this.customTheme = new CustomTheme(data);
        });
        const settingsInterval = setInterval(() => {
            if (!vueApp?.$refs?.settings) return;
            clearInterval(settingsInterval);
            this.addSettingsHooks();
            vueApp.$refs.settings.initModSettings();
        }, 250);
        const externInterval = setInterval(() => {
            if (!extern?.specialItemsTag) return;
            clearInterval(externInterval);
            this.addExternFuncs();
            this.addAllModFunctions();
            this.tryShowModErrorPopups();
        }, 250);
        localStore.setItem(MegaMod.KEYS.InitFinished, true);
    }

    start() {
        MegaMod.log("start() -", "Starting The MegaMod");

        // localStore Upgrades
        Object.assign(localStore, {
            // Workaround for localStorage storing bools as strings
            getBoolItem(key) {
                const value = this.getItem(key);
                return value === 'true' ? true : (value === 'false' ? false : null);
            },
            // Workaround for localStorage storing ints as strings
            getNumItem(key) {
                const value = parseFloat(this.getItem(key));
                return (!isNaN(value)) ? value : null;
            },
            // Workaround for localStorage storing objects as strings
            getObjItem(key) {
                const value = this.getItem(key);
                try {
                    return value ? JSON.parse(value) : null;
                } catch (e) {
                    console.warn(`Invalid JSON in localStorage for key: ${key}`);
                    return null;
                }
            }
        });
        
        MegaMod.setFatalErr(localStore.getItem(MegaMod.KEYS.ErrVersion) !== null); 

        if (!MegaMod.fatalErr) {
            MegaMod.addHTMLEdits();
            // Add those W MegaMod styles
            MegaMod.fetchCSS('/css/megaMod.css').then(css => document.body.appendChild(Object.assign(document.createElement('style'), { textContent: css })));
            
            // Get loc data, get settings, init settings
            MegaMod.fetchJSON('/data/loc.json')
                .then(data => { 
                    this.loc = data; 
                    const megaModInitInterval = setInterval(() => {
                        if (!vueApp) return;
                        clearInterval(megaModInitInterval);
                        MegaMod.fetchJSON('/data/settings.json').then(settings => this.init(settings));
                    }, 250);
                });
        } else {
            this.checkInfo();
            MegaMod.checkError();
        }
    }
}

class BetterUI {   
    static GAME_HISTORY_KEYS = {
        list: "megaMod_gameHistory_list",
        time: "megaMod_gameHistory_time"
    };
    constructor(data) {
        MegaMod.log("Initializing Mod:", "Better UI");

        Object.assign(this, data);
        this.squareIconIndexes = SOCIALMEDIA.map((icon, index) => icon.includes("-square") ? index : null).filter(index => index !== null);

        const oldTryEquipItem = extern.tryEquipItem;
        Object.assign(extern, {
            isThemedItem(item, theme) {
                //MegaMod.log("extern.isThemedItem() - ", `Checking if ${item.name} is ${theme}`);
                theme = theme.toLowerCase();
                switch (theme) {
                    case "vip":
                    case "physical":
                    case "manual":
                    case "default":
                    case "purchase":
                        // Nice and ez checks, W devs.
                        return item.unlock === theme;
                    case "premium":
                        return item.unlock === theme && !this.isThemedItem(item, "bundle");
                    case "bundle":
                        return item.unlock === theme || item.unlock == "premium" && item?.item_data?.tags?.includes(unsafeWindow.megaMod.betterUI.tags.bundle);
                    case "eggpremium":
                        return this.isThemedItem(item, "purchase") && (item?.item_data?.tags?.some(tag => tag.toLowerCase() === 'premium') ?? false);
                    case "legacy":
                        return this.isThemedItem(item, "default") && item?.item_data?.meshName?.includes("_Legacy");
                    case "limited":
                        return item?.item_data?.tags?.includes("Limited") ?? false;
                    case "drops":
                        // No native "twitch" or "drops" unlock type yet :(
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.some(tag => tag.toLowerCase().includes("drops"));
                    case "notif":
                        // No native "notification" unlock type yet...probably because the notif system died :(
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.includes('Reward');
                    case "league":
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.some(tag => unsafeWindow.megaMod.betterUI.leagueTags.includes(tag.toLowerCase()));
                    case "yolker":
                        // No native "newsletter" or "ny" unlock type yet :(
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.includes('Newsletter');
                    case "promo":
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.includes(unsafeWindow.megaMod.betterUI.tags.promo);
                    case "event":
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.includes(unsafeWindow.megaMod.betterUI.tags.event);
                    case "social":
                        return this.isThemedItem(item, "manual") && item?.item_data?.tags?.includes(unsafeWindow.megaMod.betterUI.tags.social); 
                    case "egglite":
                        return this.isThemedItem(item, "manual") && ["limited", "drops", "notif", "league", "yolker", "promo", "event", "social"].every(theme => !this.isThemedItem(item, theme));
                    case "creator":
                        const creatorTags = unsafeWindow.megaMod.betterUI.creatorTypes.map(type => unsafeWindow.megaMod.betterUI.tags.creator.format(type));
                        return item?.item_data?.tags?.some(tag => creatorTags.includes(tag)) ?? false;
                    case "creatoryt":
                        return item?.item_data?.tags?.includes(unsafeWindow.megaMod.betterUI.tags.creator.format(unsafeWindow.megaMod.betterUI.creatorTypes[4])) ?? false;
                    case "creatorttv":
                        return item?.item_data?.tags?.includes(unsafeWindow.megaMod.betterUI.tags.creator.format(unsafeWindow.megaMod.betterUI.creatorTypes[6])) ?? false;
                    case "shop":
                        return this.isThemedItem(item, "purchase") && ["creator", "limited", "event"].every(theme => !this.isThemedItem(item, theme));
                }
            },
            getAllItems() {
                return [
                    ...this.catalog.hats, 
                    ...this.catalog.stamps, 
                    ...this.catalog.grenades, 
                    ...this.catalog.primaryWeapons, 
                    ...this.catalog.secondaryWeapons, 
                    ...this.catalog.melee
                ];
            },
            getThemedItems(theme) {
                return this.getAllItems().filter(item => !theme || this.isThemedItem(item, theme));
            },
            getThemeMap(item) {
                return Object.fromEntries(unsafeWindow.megaMod.betterUI.themes.map(theme => [theme, this.isThemedItem(item, theme)]));
            },
            getThemeForItem(item) {
                const themeMap = this.getThemeMap(item);
                return Object.keys(themeMap).find(theme => themeMap[theme]);
            },
            getThemeForItems(items) {
                const themes = items.map(item => this.getThemeForItem(item));
                const countMap = {};
                for (const str of themes) countMap[str] = (countMap[str] || 0) + 1;

                const entries = Object.entries(countMap);
                entries.sort((a, b) => b[1] - a[1]);

                const [topStr, topCount] = entries[0];
                const allEqual = entries.every(([_, count]) => count === topCount);

                return allEqual ? themes.getRandom() : topStr;
            },
            tryEquipItem(item, type) {
                if (!(this.isEquipModeInventory && vueApp.itemVaultEnabled) || (item && this.isItemOwned(item))) oldTryEquipItem.call(this, item, type);
            }
        });

        // Add needed item tags to items - hopefully this will be done natively, BWD will get around to it...eventually :)
        // Wait for specialItemsTag and catalog to be initialized
        // I could just fetch shellshock.io/data/housePromo.json to get the specialItemsTag
        const itemTagInterval = setInterval(() => {
            if (!extern?.catalog || !extern.specialItemsTag) return;
            clearInterval(itemTagInterval);

            const addTags = (add, item, tags) => {
                if (!item) return;
                tags = Array.isArray(tags) ? tags : [tags];
                tags.forEach(tag => {
                    if (add === item.item_data.tags.includes(tag)) {
                        MegaMod.error("Better UI", `"${tag}" Item Tag is Already ${add ? "Present" : "Missing"} for ${item.name}`);
                        return;
                    }
                    if (!item.item_data.tags) item.item_data.tags = [];
                    if (add) {
                        item.item_data.tags.push(tag);
                    } else {
                        item.item_data.tags.splice(item.item_data.tags.indexOf(tag), 1);
                    }
                });
            };

            // Bundle Items
            extern.catalog.findItemsByIds(extern.getActiveBundles().flatMap(bundle => bundle.itemIds)).filter(item => !this.isThemed(item)).forEach(item => addTags(true, item, this.tags.bundle));

            // Add or Remove Missing/Wrong Item Tags
            this.tagEdits.forEach(edit => addTags(edit.add, extern.catalog.findItemById(edit.id), edit.tags));

            this.updateBundleItems(extern.modSettingEnabled("betterUI_inventory"));

            // Add "Creator" and Social Type tags to Content Creator Shop Items
            this.creatorData.forEach(creator => {
                const type = this.creatorTypes[creator.type];
                extern.catalog.findItemsByIds(creator.itemIds).forEach(item => {
                    item.creatorUrl = creator.link;
                    addTags(true, item, this.tags.creator.format(type));
                })
            });

            this.promoData.forEach(promo => {
                extern.catalog.findItemsByIds(promo.itemIds).forEach(item => {
                    item.promoUrl = promo.link;
                    addTags(true, item, this.tags.promo);
                });
            });

            vueApp.$refs.equipScreen.setupItemTotals()
        }, 250);

        fetch('https://ipapi.co/currency/').then(res => res.text()).then(res => {
            if (Object.keys(this.currencyIcons).includes(res) && this.currencyIcons[res]) vueApp.currencyCode = res;
        });

        // Better Inventory - Item Properties
        comp_item.created = function() {
            this.themeMap = extern?.getThemeMap?.(this.item);
        };
        Object.assign(comp_item.props, { isReward: { type: Boolean, default: false } });
        const oldPremium = comp_item.computed.isPremium;
        Object.assign(comp_item.computed, {
            isPremium() { return this?.themeMap?.premium || oldPremium.call(this); },
            isBundle() { return this?.themeMap?.bundle; },
            isMerch() { return this?.themeMap?.physical; },
            isDrops() { return this?.themeMap?.drops; },
            isNotif() { return this?.themeMap?.notif; },
            isLeague() { return this?.themeMap?.league; },
            isNewYolker() { return this?.themeMap?.yolker; },
            isEgglite() { return this?.themeMap?.egglite; },
            isCreator() { return this?.themeMap?.creator; },
            isTwitchCreator() { return this?.themeMap?.creatorttv; },
            isYTCreator() { return this?.themeMap?.creatoryt; },
            isPromo() { return this?.themeMap?.promo; },
            isEvent() { return this?.themeMap?.event; },
            isSocial() { return this?.themeMap?.social; },
            isNormalShop() { return this?.themeMap?.shop; },
            isLegacy() { return this?.themeMap?.legacy; },
            isPremiumEggPurchase() { return this?.themeMap?.eggpremium; },

            isNewTheme() {
                return this.isLimited || this.isBundle || this.isMerch || this.isDrops ||
                    this.isNotif || this.isLeague || this.isNewYolker || this.isEgglite || 
                    this.isPromo || this.isEvent || this.isSocial || this.isCreator || 
                    this.isLegacy;
            },

            themeActive() {
                return extern.modSettingEnabled("betterUI_inventory");
            },
        
            // Banner check
            hasBanner() {
                
                return this.isPremium || this.isVipItem || this.isPremiumEggPurchase || (this.themeActive && this.isNewTheme);
            },
        
            // Banner Text
            bannerTxt() {
                if (!this.hasBanner) return '';

                const bannerLocMap = [
                    ['isBundle', 'p_bundle_item_banner_txt'],
                    ['isPremium', 'p_premium_item_banner_txt'],
                    ['isPremiumEggPurchase', 'p_premium_item_banner_txt'],
                    ['isVipItem', 'p_vip_item_banner_txt'],
                    ['isMerch', 'p_merch_item_banner_txt'],
                    ['isDrops', 'p_drops_item_banner_txt'],
                    ['isNotif', 'p_notif_item_banner_txt'],
                    ['isLeague', 'p_league_item_banner_txt'],
                    ['isNewYolker', 'p_yolker_item_banner_txt'],
                    ['isEgglite', 'p_egglite_item_banner_txt'],
                    ['isCreator', 'p_creator_item_banner_txt'],
                    ['isLimited', 'p_limited_item_banner_txt'],
                    ['isSocial', 'p_social_item_banner_txt'],
                    ['isPromo', 'p_promo_item_banner_txt'],
                    ['isEvent', 'p_event_item_banner_txt'],
                    ['isLegacy', 'p_legacy_item_banner_txt']
                ];
                return this.loc[bannerLocMap.find(([themeProp]) => this[themeProp])?.[1]] || '';
            },
        
            // CSS Classes
            itemClass() {
                return {
                    'highlight': this.isSelected,
                    'is-bundle': this.isBundle,
                    'is-premium': this.isPremium || this.isPremiumEggPurchase,
                    'is-vip': this.isVipItem,
                    'is-merch': this.themeActive && this.isMerch,
                    'is-drops': this.themeActive && this.isDrops,
                    'is-ny': this.themeActive && this.isNewYolker,
                    'is-notif': this.themeActive && this.isNotif,
                    'is-league': this.themeActive && this.isLeague,
                    'is-egglite': this.themeActive && this.isEgglite,
                    'is-promo': this.themeActive && this.isPromo,
                    'is-event': this.themeActive && this.isEvent,
                    'is-social': this.themeActive && this.isSocial,
                    'is-creator-yt': this.themeActive && this.isYTCreator,
                    'is-creator-ttv': this.themeActive && this.isTwitchCreator,
                    'is-shop': this.themeActive && this.isNormalShop,
                    'is-legacy': this.themeActive && this.isLegacy,
                    'is-locked': this.themeActive && this.showLockIcon,
                    'customtheme': this.themeActive && this.isNewTheme
                };
            },
        
            // Tooltips
            tooltip() {
                if (!(this.showTooltip && this.themeActive)) return "tool-tip";
                const tooltipStyleMap = [
                    ['isDrops', 'drops'],
                    ['isBundle', 'bundle'],
                    ['isLimited', 'limited'],
                    ['isPremium', 'premium'],
                    ['isPremiumEggPurchase', 'premium'],
                    ['isVipItem', 'vip'],
                    ['isMerch', 'merch'],
                    ['isNewYolker', 'ny'],
                    ['isNotif', 'notif'],
                    ['isLeague', 'league'],
                    ['isEgglite', 'egglite'],
                    ['isPromo', 'promo'],
                    ['isEvent', 'event'],
                    ['isSocial', 'social'],
                    ['isYTCreator', 'ytcc'],
                    ['isTwitchCreator', 'ttvcc'],
                    ['isLegacy', 'legacy']
                ];
                const tooltipStyle = tooltipStyleMap.find(([themeProp]) => this[themeProp])?.[1];
                return "tool-tip" + (tooltipStyle ? " " + tooltipStyle : "") + (this.showLockIcon ? " locked" : "");
            },
        
            // Icon Check
            hasIcon() {
                return this.isBundle || this.isPremium || this.isPremiumEggPurchase || this.isLeague || this.isEgglite ||
                    this.isLimited || this.isDrops || this.isNotif || this.isMerch || 
                    this.isCreator || this.isNewYolker || this.isPromo || 
                    this.isEvent || this.isSocial || this.isLegacy /*|| this.isNormalShop*/;
            },

            showIcon() {
                return this.hasIcon && ((this.isBundle && !this.isItemOwned) || this.itemOnly || this.isReward || vueApp.currentEquipMode === vueApp.equipMode.inventory);
            },

            // Premium Icon
            premiumIcon() {
                return unsafeWindow.megaMod.betterUI.currencyIcons[vueApp.currencyCode] || '';
            },
        
            // Icon CSS Class
            iconClass() {
                if (!this.hasIcon) return '';
                const iconClassMap = [
                    ['isBundle', 'fas fa-box-open hover'],
                    ['isPremium', this.premiumIcon + ' hover'],
                    ['isMerch', 'fas fa-tshirt hover'],
                    ['isDrops', 'fab fa-twitch hover'],
                    ['isNotif', 'fas fa-bell hover'],
                    ['isLeague', 'fas fa-trophy hover'],
                    ['isNewYolker', 'fas fa-envelope-open-text hover'],
                    ['isEgglite', 'fas6 fa-sparkles hover'],
                    ['isYTCreator', 'fab fa-youtube hover'],
                    ['isTwitchCreator', 'fab fa-twitch hover'],
                    ['isLimited', 'far fa-gem hover'],
                    ['isSocial', 'fas fa-share hover'],
                    ['isPromo', 'fas fa-ad hover'],
                    ['isEvent', 'fas fa-calendar-alt hover'],
                    ['isNormalShop', 'fas fa-egg hover'],
                    ['isPremiumEggPurchase', 'fas fa-egg hover'],
                    ['isLegacy', 'fas6 fa-history hover']
                ];
                return iconClassMap.find(([themeProp]) => this[themeProp])?.[1] || '';
            },
        
            // Icon Hover
            iconHover() {
                return (this.isVipItem || this.iconClass.includes("hover")) ? () => { /*BAWK.play("ui_chicken");*/ } : () => {};
            },
        
            // Icon Click
            iconClick() {
                let fn = () => {};

                const addClickSFX = (func) => () => { BAWK.play("ui_equip"); func(); };
                if (this.item.creatorUrl && this.isCreator) fn = addClickSFX(() => open(`https://${this.item.creatorUrl}`));
                if (this.item.promoUrl && this.isPromo) fn = addClickSFX(() => open(`https://${this.item.promoUrl}`));
                if (this.isSocial) fn = addClickSFX(() => open(vueApp.ui.socialMedia.footer.find(social => social.id === this.item.id).url));
                
                const theme = extern.getThemeForItem(this.item);
                if (theme) return (() => { vueApp.$refs.equipScreen.showItemTheme(theme); fn() });
                return fn;
            },

            // Lock Icon
            showLockIcon() {
                return !(this.isItemOwned || extern.isThemedItem(this.item, "default")) && vueApp.currentEquipMode === vueApp.equipMode.inventory;
            },
            lockIconClass() {
                return (this.isPremium || this.isCreator || this.isNormalShop || this.isPremiumEggPurchase || (this.item.unlock === "purchase" && this.item.price !== 2147483647))
                    ? 'fas6 fa-lock' :
                    this.isVipItem ? 'fas fa-egg' :
                    this.isSocial ? 'fas fa-share' : 'fas6 fa-lock';
            }
        });

        const oldEmptyGridMsg = comp_item_grid.computed.emptyGridMsg;
        Object.assign(comp_item_grid.computed, {
            invEditsEnabled() {
                return extern.modSettingEnabled("betterUI_inventory");
            },

            // Better Inventory - Modify Item Sorting (Order)
            // Premium --> VIP --> Bundle --> Merch --> Drops --> Yolker --> League --> Notif --> Egglite --> Promo --> Event --> Social --> Default/Legacy --> Limited --> Creator --> Shop
            itemsSorted() {
                const isThemed = (item, theme) => {
                    this.itemThemeMap[item.id] ??= {};
                    return this.itemThemeMap[item.id][theme] ??= extern.isThemedItem(item, theme);
                };

                // Precompute theme order and their active status
                const themeOrder = unsafeWindow.megaMod.betterUI.themeOrder
                    .filter(theme => !theme.custom || this.invEditsEnabled)
                    .map(theme => theme.theme);

                return this.items.sort((b, a) => {
                    for (const theme of themeOrder) {
                        const result = isThemed(a, theme) - isThemed(b, theme)
                        if (result !== 0) return result;
                    }
                    return 0;
                });
            },
            emptyGridMsg() {
                if (this.invEditsEnabled && this.itemVaultEnabled) {
                    return {
                        title: this.loc['megamod_betterUI_i_eq_emptyVault_head'],
					    text: this.loc['megamod_betterUI_i_eq_emptyVault_text']
                    };
                } else {
                    return oldEmptyGridMsg.call(this);
                }
            }
        });

        // Challenge Claim SFX
        const oldChallengeClaim = extern.playerChallenges.claim;
        extern.playerChallenges.claim = function(...args) {
            oldChallengeClaim.apply(this, args);
            if (extern.modSettingEnabled("betterUI_chlg")) BAWK.play("challenge_notify");
        };

        // Notify Popup Claim SFX
        const oldNextItem = NotifiSlider.methods.nextItem;
        NotifiSlider.methods.nextItem = function(...args) {
            oldNextItem.apply(this, args);
            if (extern.modSettingEnabled("betterUI_chlg") && this.isChallenge) BAWK.play("challenge_notify");
        };

        // Fixed Weapon Deselect Bug
        const oldSelectItem = vueApp.$refs.equipScreen.selectItem;
        Object.assign(vueApp.$refs.equipScreen, {
            selectItem(item) {
                if (extern.modSettingEnabled("betterUI_inventory")) {
                    if (this.itemVaultEnabled && item.item_type_id === ItemType.Stamp && this.$refs.stampCanvas) extern.renderItemToCanvas(item, this.$refs.stampCanvas);
                    const selectingSame = hasValue(this.equip.selectedItem) && this.equip.selectedItem.id === item.id;
                    const isWeapon = ![ItemType.Hat, ItemType.Stamp].includes(item?.item_type_id);
                    if (selectingSame && isWeapon) {
                        this.selectItemClickSound(item);
                        return;
                    }
                }
                oldSelectItem.call(this, item);
            },
            renderStamp() {
                if (this.$refs.stampCanvas === undefined) return;
    
                const item = this.isEquipModeInventory ? this.equip.selectedItem : this.equipped[ItemType.Stamp];
                // Fixing BWD's buggy code errors...smh
                if (!item) return;
                extern.renderItemToCanvas(item, this.$refs.stampCanvas);
            },
        });

        // Add CSS
        Promise.all([
            MegaMod.addModCSS('betterUI/ui'),
            MegaMod.addModCSS('betterUI/inventory'),
            MegaMod.addModCSS('betterUI/roundness'),
            MegaMod.addModCSS('betterUI/colors'),
            MegaMod.addModCSS('betterUI/chlg'),
            MegaMod.addModCSS('betterUI/weapons'),
            MegaMod.addModCSS('betterUI/distance'),
            MegaMod.addModCSS('betterUI/spatula')
        ]).then(styles => {
            const [UITweaksStyle, betterInvStyle, roundnessStyle, coloredStyle, chlgStyle, weaponStyle, distanceStyle, spatulaStyle] = styles;
            Object.assign(this, { UITweaksStyle, betterInvStyle, roundnessStyle, coloredStyle, chlgStyle, weaponStyle, distanceStyle, spatulaStyle });
            setTimeout(this.switchBetterUI.bind(this), 250, true);
        });


        // Init Profile Badges
        MegaMod.fetchJSON('/mods/data/badges.json').then(data => this.initProfileBadges(data));

        // Fresh Player Badge Alert
        const oldAssetSetup = vueApp.assetSetup;
        vueApp.assetSetup = function(totalAssets) {
            oldAssetSetup.call(this, totalAssets);
            if (!(extern.modSettingEnabled('betterUI_profile') && totalAssets === this.ui.homeToGameProgressBar.nonAccountTotal)) return;
            ((badge) => {
                if (!badge) return;
                const removeHover = style => style.replace(/\bbadge-hover(-alt)?\b/g, '').trim();
                vueApp.addBadgeMsg({
                    type: BadgeMsgType.coreGained,
                    badgeClass: removeHover(badge.styleClass),
                    iconClass: removeHover(badge.classList),
                    badgeName: badge.title
                });
            })(vueApp.getBadges(true).main.find(badge => badge.classList.includes("badge-newbie")));
        };

        const oldAfterLeftGame = vueApp.$refs.gameScreen.afterLeftGame;
        vueApp.$refs.gameScreen.afterLeftGame = function(...args) {
            unsafeWindow?.megaMod?.betterUI?.checkOpenGames();
            oldAfterLeftGame.apply(this, args);
        }

        // Init Game Histry 
        this.initGameHistory();

        // Revert Join Game Code to parsedUrl.hash
        const { 
            onXClick: oldCodeXClick, 
            onCloseClick: oldCodeCloseClick 
        } = vueApp.$refs.homeScreen.$refs.playPanel.$refs.joinPrivateGamePopup;
        const wrapWithHashCode = (originalFn) => function() {
            originalFn.call(this);
            if (parsedUrl?.hash) vueData.home.joinPrivateGamePopup.code = parsedUrl.hash; 
        };
        Object.assign(vueApp.$refs.homeScreen.$refs.playPanel.$refs.joinPrivateGamePopup, {
            onXClick: wrapWithHashCode(oldCodeXClick),
            onCloseClick: wrapWithHashCode(oldCodeCloseClick)
        });

        // Add to Game History
        const oldProgBarReset = vueApp.progressBarReset;
        vueApp.progressBarReset = function() {
            oldProgBarReset.call(this);
            MegaMod.createFocusTimer(100, 1500, function() {
                if(extern.inGame) megaMod.betterUI.addGameToHistory();
            });
        };

        // Chick'n Winner Bar
        const oldPlayIncentivizedAd = vueApp.playIncentivizedAd;
        vueApp.playIncentivizedAd = function() {
            if (extern.modSettingEnabled("betterUI_cw") && this.chw.limitReached && extern.inGame && !this.chw.ready) {
                BAWK.play("ui_playconfirm");
                this.chwBarVisible = false;
                const barInterval = setInterval(((chq) => {
                    if (this.chw.limitReached && !this.chw.ready) return;
                    clearInterval(barInterval);
                    this.chwBarVisible = true;
                }).bind(this), 200);
            }
            oldPlayIncentivizedAd.call(this, e);
        };

        // Weapon Icons
        Object.assign(unsafeWindow, {
            WeaponIcons: {
                [CharClass.Soldier]: "ico-weapon-soldier",
                [CharClass.Scrambler]: "ico-weapon-scrambler",
                [CharClass.Ranger]: "ico-weapon-ranger",
                [CharClass.Eggsploder]: "ico-weapon-rpegg",
                [CharClass.Whipper]: "ico-weapon-whipper",
                [CharClass.Crackshot]: "ico-weapon-crackshot",
                [CharClass.TriHard]: "ico-weapon-trihard"
            }
        });

        // Switch Local Weapon Icon
        const oldChangeClass = extern.changeClass;
        extern.changeClass = function(...args) {
            oldChangeClass.apply(this, args);
            if (!extern.inGame) return;
            const iconElem = document.querySelector(".playerSlot-player-is-me .weapon-icon");
            if (iconElem) {
                iconElem.classList.add('fade');
                setTimeout(() => {
                    const useElem = iconElem.querySelector('use');
                    if (useElem) useElem.setAttribute("xlink:href", `#${WeaponIcons[extern.account.classIdx]}`);
                    iconElem.classList.remove('fade');
                }, 150);
            }
        }

        // Add Cluck 9mm Icon
        const origCS = document.getElementById("ico-weapon-crackshot");
        if (origCS) {
            const clone = origCS.cloneNode(true);
            if (clone) {
                clone.setAttribute("id", "ico-weapon-cluck9mm");
                const path = clone.querySelector("path");
                if (path) {
                    path.setAttribute("d", "m 74.123679,15.2632 -3.892051,3.404789 -3.367849,-1.6014 -3.194297,2.569333 1.313599,3.666123 -17.75929,15.559012 -2.997173,0.310288 -13.281248,11.649535 -1.75243,-1.32836 -2.817757,2.294141 1.115857,2.114503 -1.459879,1.280507 c -0.58459,0.512127 -0.702045,1.376148 -0.275445,2.025785 l 7.348988,11.075341 4.831409,0.494124 10.292704,20.059523 5.804954,1.900356 9.419724,-9.891386 L 63.771664,74.93931 58.11778,63.566626 68.469584,53.15475 63.281887,46.248185 69.097355,40.784646 68.27507,38.893585 79.944665,28.442673 79.184156,27.441196 80.5,26.340667 l -2.039778,-2.89704 1.647881,-1.331393 z m -15.757704,31.881959 1.258651,0.610767 4.34759,5.088222 -7.388756,7.502059 -0.973856,-1.968725 3.444783,-3.752319 -5.593756,-2.925061 z");
                    origCS.parentNode.insertBefore(clone, origCS.nextSibling);
                }
            }
        }

        // Zoomed In Grenade & Melee Icons
        ["ico-grenade", "ico-melee"].forEach(id => {
            const origIcon = document.getElementById(id);
            if (origIcon) {
                origIcon.querySelector("path").style.fill = "";
                const clone = origIcon.cloneNode(true);
                if (clone) {
                    clone.setAttribute("id", id.replace("-", "-weapon-"));
                    clone.setAttribute("viewBox", "5 5 48 48");
                    origIcon.parentNode.insertBefore(clone, origIcon.nextSibling);
                }
            }
        });
    }

    initGameHistory() {
        const history = JSON.parse(localStore.getItem(BetterUI.GAME_HISTORY_KEYS.list));
        if (history) vueApp.gameHistory = history;
        setTimeout(this.checkOpenGames.bind(this), 1000);
    }

    checkGameHistory() {
        const now = new Date();
        const then = new Date(localStore.getItem(BetterUI.GAME_HISTORY_KEYS.time));
        if (!then || then.toDateString() !== now.toDateString()) {
            vueApp.gameHistory = [];
            localStore.setItem(BetterUI.GAME_HISTORY_KEYS.time, now.toJSON());
            this.saveGameHistory();
        }
    }

    addGameToHistory() {
        this.checkGameHistory();
        const gameCode = vueApp.game.shareLinkPopup.code.toUpperCase();
        if (!gameCode) return;

        const mapData = {
            map: { name: vueApp.game.mapName },
            modeLoc: vueApp.gameTypes.find(type => type.value === vueApp.game.gameType).locKey,
            serverLoc: `server_${vueApp.currentRegionId}`,
            gameCode: gameCode,
            isPrivate: extern.isPrivateGame,
            isOpen: true
        };
        mapData.map.filename = vueApp.maps.find(map => map.name === mapData.map.name).filename;

        vueApp.gameHistory = vueApp.gameHistory.filter(game => game.gameCode !== gameCode);
        vueApp.gameHistory.push(mapData);

        this.saveGameHistory();
    }

    saveGameHistory() {
        localStore.setItem(BetterUI.GAME_HISTORY_KEYS.list, JSON.stringify(vueApp.gameHistory));
    }

    setGameClosed(id) {
        vueApp.gameHistory[vueApp.gameHistory.findIndex(game => game.gameCode === id)].isOpen = false;
        if (unsafeWindow.megaMod?.betterEggforce) unsafeWindow.megaMod.betterEggforce.closeBanGames(id);
        this.saveGameHistory(); // Could do this at the end of setting all games closed
    }

    checkGame(id) {
        Object.assign(new WebSocket(`${isHttps() ? "wss" : "ws"}://${window.location.hostname}/matchmaker/`), {
            noticeReceived: false,
            onopen() {
                this.send(JSON.stringify({
                    command: "joinGame",
                    id,
                    observe: false,
                    sessionId: extern.account.sessionId
                }));
            },
            onmessage(e) { 
                const data = JSON.parse(e.data);
                const { command, error } = data;
                if (this.noticeReceived && error === "gameNotFound") {
                    unsafeWindow.megaMod.betterUI.setGameClosed(id.toUpperCase());
                }
                if (command === "validateUUID") {
                    this.send(JSON.stringify({
                        command: "validateUUID",
                        hash: unsafeWindow.validate(data.uuid)
                    }));
                    return;
                }
                this.noticeReceived = command === "notice";
            }
        });
    }

    checkOpenGames() {
        MegaMod.log("checkOpenGames() -", "Checking Open Games...");
        this.checkGameHistory();
        if (!extern.inGame) vueApp.gameHistory.filter(game => game?.isOpen).forEach(({ gameCode }) => this.checkGame(gameCode.toLowerCase()));
        
        if (this.gameHistoryTimeout) clearTimeout(this.gameHistoryTimeout);
        this.gameHistoryTimeout = setTimeout(this.checkOpenGames.bind(this), 5*60000);
    }

    initProfileBadges(badgeData) {
        MegaMod.log("Better UI:", "Initializing Profile Badges");

        this.badgeData = badgeData;
        const {
            switchToProfileUi : oldSwitchToProfileUi,
            statsLoading: oldStatsLoading,
            switchToHomeUi: oldSwitchToHomeUi,
            showGiveStuffPopup: oldShowGiveStuffPopup
        } = vueApp;
        Object.assign(vueApp, {
            separateRows(badges) {
                const badgesPerRow = unsafeWindow.megaMod.betterUI.badgeData.badgesPerRow;
                const rows = [];
                let mainIndex = 0;
                let tierIndex = 0;
                
                const createRow = (numBadges) => {
                    const row = { main: [], tier: [] };
                    while (row.main.length + row.tier.length < numBadges && (mainIndex < badges.main.length || tierIndex < badges.tier.length)) {
                        if (mainIndex < badges.main.length && row.main.length + row.tier.length < numBadges) 
                            row.main.push(badges.main[mainIndex++]);
                        if (tierIndex < badges.tier.length && row.main.length + row.tier.length < numBadges) 
                            row.tier.push(badges.tier[tierIndex++]);
                    }
                    return row;
                };
                
                rows.push(createRow(badgesPerRow - 2));
                while (mainIndex < badges.main.length || tierIndex < badges.tier.length) rows.push(createRow(badgesPerRow));
                return rows;
            },
            getBadges(info = false) {
                const mainBadges = [];
                const tierBadges = [];
                const badgeMap = new Map();
                const addBadge = (tier, title, icon, styleClass, clickFunc, desc) => (tier != null ? tierBadges : mainBadges).push({ title, styleClass, classList: `${icon} ${styleClass}`, tier, clickFunc, desc });
                const numeral = num => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][num - 1] || num;
                const formatValue = value => value % 1 === 0 ? value.toLocaleString() : value.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                
                const { types, badges, creatorData } = unsafeWindow.megaMod.betterUI.badgeData;
                const setupBadge = (badge, index) => {
                    if (index != null) badge.tier = index + 1;
                    const data = types[badge.type] || {};
                    
                    const tierLocKeys = data.tierLocKeys || badge.tierLocKeys;
                    const locKey = (tierLocKeys && badge.tier) ? tierLocKeys[index] : (data.locKey || badge.locKey);
                    const titleLocKey = vueApp.loc[`${locKey}_title`] ? `${locKey}_title` : locKey;
                    
                    const tierIcons = data.tierIcons || badge.tierIcons;
                    const icon = (tierIcons && badge.tier) ? tierIcons[index] : (data.icon || badge.icon);
                    
                    const oldClickFunc = eval(data.clickFunc || badge.clickFunc || 'null');
                    const clickFunc = oldClickFunc ? () => { BAWK.play("ui_click"); oldClickFunc(); } : () => {};
                    
                    if (data.class) badge.class += data.class;
                    if (badge.tier) badge.class += ` tier${badge.tier}`;
                    if (oldClickFunc && !badge.class.split(" ").includes("badge-hover")) badge.class += ' badge-hover';
                    
                    const condition = `${data.condition || ''}${badge.condition || ''}`.format(badge.value || '');
                    if (info || eval(condition)) { 
                        let mapKey = badge.class.includes("badge-social") ? badge.class : locKey;
                        if (info && badge.tier) mapKey += badge.tier;
                        const newBadge = { 
                            ...badge, icon, clickFunc, 
                            title: (this.loc[titleLocKey] || titleLocKey || '').format(numeral(badge.tier), badge.value) 
                        };
    
                        if (badge.tier) {
                            const existingBadge = badgeMap.get(mapKey);
                            if (info || (!existingBadge || badge.tier > existingBadge.tier)) 
                                badgeMap.set(mapKey, newBadge);
                        } else {
                            badgeMap.set(mapKey, newBadge);
                        }
                        
                        if (info) {
                            badge.precision = data.precision || badge.precision;
                            badge.ignorePlus = data.ignorePlus || badge.ignorePlus;
                            if (badge.precision) badge.value = badge.value.toFixed(badge.precision);
                            let value = badge.value ? formatValue(badge.value) : '';
                            if (!badge.ignorePlus && badge?.tier === badge?.tierValues?.length) value += "+";
                            const badgeObj = badgeMap.get(mapKey);
                            badgeObj.desc = (this.loc[`${locKey}_desc`] || badge.desc || '');
                            badgeObj.desc = badgeObj.desc
                                .format((badgeObj.value === 1 && badgeObj.desc.includes("{s}")) ? "a" : value)
                                .replace("{over}", (badgeObj?.tier === badge?.tierValues?.length && badgeObj.value !== 100) ? "over " : "")
                                .replace("{s}", badgeObj.value === 1 ? "" : "s");
                        }
                    }
                };
                
                badges.forEach(badge => {
                    if (badge.tierValues) badge.tierValues.forEach((value, i) => setupBadge({ ...badge, value }, i));
                    else setupBadge(badge);
                });
                const contentCreator = info ? creatorData : (this.contentCreator?.filter?.(s => s.active) || []);
                if (contentCreator?.length) {
                    const locKey = `megaMod_betterUI_badge_social`;
                    contentCreator.forEach(s => {
                        const social = SOCIALMEDIA[s.id].split("-")[1].replace(/\w\S*/g, 
                            (x) => x.charAt(0).toUpperCase() + x.substr(1).toLowerCase()
                        ).replace(/^Twitter$/, "Twitter (X)");
                        const badgeData = { 
                            condition: true,
                            locKey: this.loc[`${locKey}_title`].format(social),
                            icon: `fab ${SOCIALMEDIA[s.id]}`,
                            class: `badge-social${s.id} ${(s.id === 1) ? "badge-hover-alt": ''}`,
                            clickFunc: () => { open(s.url) }
                        };
                        if (info) badgeData.desc = this.loc[`${locKey}_desc`].format(social);
                        setupBadge(badgeData);
                    });
                }
                badgeMap.forEach(badge => addBadge(badge.tier, badge.title, badge.icon, badge.class, badge.clickFunc, badge.desc));
                
                const returnData = { main: mainBadges, tier: tierBadges };
                return info ? returnData : { rows: this.separateRows(returnData).map(({ main, tier }) => ({ main, tier })) };
            },
            getBadgeInfo() {
                return this.getBadges(true);
            },
            showBadgeInfo() {
                BAWK.play("ui_popupopen");
                vueApp.$refs.badgeInfoPopup.show();
            },
            switchToProfileUi() {
                oldSwitchToProfileUi.call(this);
                this.updateBadges();
            },
            showBadgeMsg() {
                if (!this.badgeMsg.msgs.length) return;
                
                const { type, badgeClass, iconClass, badgeName } = this.badgeMsg.msgs.shift();
                const { locKey, sfx } = BadgeMsgTypeData[type];
                BAWK.play(sfx);

                Object.assign(this.badgeMsg, {
                    titleLocKey: locKey,
                    badgeClass: badgeClass,
                    iconClass: iconClass,
                    badgeName: badgeName,
                    showing: true
                });

                setTimeout(() => {
                    this.badgeMsg.showing = false;
                    this.showBadgeMsg();  // Recursive call to process the next message
                }, (BAWK.sounds[sfx]?.buffer?.duration || 1.2) * 1000);
            },
            addBadgeMsg(msg) {
                // Add the new message
                this.badgeMsg.msgs.push(msg);
            
                // Remove duplicates: Convert the array to a Set and back to an array
                this.badgeMsg.msgs = [...new Set(this.badgeMsg.msgs)];
            
                // Proceed with displaying the message if not already showing
                if (!this.badgeMsg.showing) this.showBadgeMsg();
            },
            statsLoading() {
                vueApp.updateBadges();
                oldStatsLoading.call(this);
            },
            switchToHomeUi() {
                vueApp.updateBadges();
                oldSwitchToHomeUi.call(this);
            },
            showGiveStuffPopup(titleLoc, eggs, items, type, callback) {
                if (items?.length && !type || type === "abTestReward") type = extern.getThemeForItems(items);
                oldShowGiveStuffPopup.call(this, titleLoc, eggs, items, type, callback);
            }
        });

        const playerAccount = extern.account.constructor;
        const { 
            signedIn: oldSignedIn, 
            loggedOut: oldLoggedOut,
            addToInventory: oldAddToInventory 
        } = playerAccount.prototype;
        Object.assign(playerAccount.prototype, {
            signedIn(...args) {
                oldSignedIn.apply(this, args);
                vueApp.photoUrl = extern.firebaseUrl;
            },
            loggedOut(...args) {
                oldLoggedOut.apply(this, args);
                this.challengesClaimed = [];
                vueApp.updateBadges(true);
            },
            addToInventory(...args) {
                oldAddToInventory.apply(this, args);
                vueApp.updateBadges();
            }
        });
        setTimeout(() => {
            vueApp.updateBadges();
            vueApp.badgeInfo = vueApp.getBadges(true);
        }, 1000);
    }

    randomizeSkin() {
        const randomItems = {};
        Object.values(ItemType).forEach(type => {
            const typeItems = extern.getItemsOfType(type).filter(item => item.unlock === "default" || extern.isItemOwned(item));
            randomItems[type] = typeItems.getRandom();
        });

        vueData.equip.selectedItem = randomItems[vueApp.equip.selectedItemType];
        Object.values(randomItems).filter(item => item != null).forEach(item => extern.tryEquipItem(item));
        extern.poseWithItems(randomItems);
        //extern.setShellColor(Math.randomInt(0, extern.account.isUpgraded() ? 13 : 6));
        vueApp.$refs.equipScreen.updateEquippedItems();
        vueApp.$refs.equipScreen.moveStamp(
            Math.randomInt(-12, 13), // -12 to 12 inclusive
            Math.randomInt(-15, 18) // -15 to 17 inclusive
        );
        vueApp.$refs.equipScreen.renderStamp();
        BAWK.play("ui_equip");
    }

    switchUITweaks(enabled) {
        this.UITweaksStyle.disabled = !enabled;
        this.squareIconIndexes.forEach(i => {
            if (enabled) {
                SOCIALMEDIA[i] = SOCIALMEDIA[i].replace("-square", "");
            } else {
                SOCIALMEDIA[i] += (!SOCIALMEDIA[i].includes("-square")) ? "-square" : "";
            }
        });
        vueApp.ui.socialMedia.footer[vueApp.ui.socialMedia.footer.map(elem => elem.icon).findIndex(icon => icon.includes("fa-steam"))].icon = (enabled) ? "fa-steam" : "fa-steam-symbol";
        if (vueApp.showScreen === vueApp.screens.home) {
            vueApp.$refs.homeScreen.$refs.playPanel.$forceUpdate(); // Update Play Buttons
            // Update Challenge Tab
            [[], vueApp.$refs.homeScreen.$refs.mediaTabs.$children[0].challenges].forEach(x => setTimeout(() => vueApp.$refs.homeScreen.$refs.mediaTabs.$children[0].challenges = x, 0));
        }
        vueApp.$refs.accountPanelHome.$forceUpdate();
        [null, vueApp.chw.resets].forEach(x => setTimeout(vueApp.chw.resets = x, 0));
    }

    switchRoundness(enabled) {
        this.roundnessStyle.disabled = !enabled;
    }

    switchColored(enabled) {
        this.coloredStyle.disabled = !enabled;
    }

    switchChlg(enabled) {
        this.chlgStyle.disabled = !enabled;
    }

    switchWeapons(enabled) {
        this.weaponStyle.disabled = !enabled;
    }

    switchDistance(enabled) {
        this.distanceStyle.disabled = !enabled;
    }

    switchSpatula(enabled) {
        const display = enabled ? "inline-block" : "none";
        const activeIcons = [...document.querySelectorAll(".playerSlot")].filter(slot => {
            if (slot.style.display !== "block") return false;
            const nameScore = slot.querySelector(".playerSlot--name-score");
            return nameScore?.classList.contains("playerSlot-spatula");
        }).map(slot => slot.querySelector(".spatula-icon"));
        if (activeIcons.length) activeIcons[0].style.display = display;
        document.querySelectorAll('#killTicker .spatula-icon').forEach(icon => icon.style.display = display);
        this.spatulaStyle.disabled = !enabled;
    }
    
    isThemed(item) {
        return ["default", "premium", "drops", "notif", "yolker", "promo", "event", "creator", "shop"].some(theme => extern.isThemedItem(item, theme));
    }

    updateBundleItems(enabled) {
        extern.getTaggedItems(this.tags.bundle).filter(i => i.unlock !== "premium").forEach(item => {
            if (!item.origUnlock) item.origUnlock = item.unlock;
            item.unlock = enabled && !this.isThemed(item) ? "bundle" : item.origUnlock;
        });
    }

    switchBetterInv(enabled, init) {
        // Set Bundle Unlock Type
        this.updateBundleItems(enabled);

        // Add/Remove "Limited" tag to Monthly Featured Items
        extern.getTaggedItems(extern.specialItemsTag).filter(item => item.is_available && !["bundle"].includes(item.unlock)).forEach(item => {
            if (!Array.isArray(item?.item_data?.tags)) item.item_data.tags = [];
            if (!enabled && item.item_data.tags.includes("Limited")) {
                item.item_data.tags.splice(item.item_data.tags.indexOf("Limited"), 1);
            } else if (enabled && item.is_available && item.item_data.tags.indexOf("Limited") === -1) {
                item.item_data.tags.push("Limited");
            }
        });

        this.betterInvStyle.disabled = !enabled;
        if (init) return;
        this.refreshItemSlots();
    }

    refreshItemSlots() {
        if (!vueApp.game.isPaused) return;
        const { inventory, skins, shop, featured } = vueApp.equipMode;
        const refreshItemGrid = () => {
            if (!vueApp.equip.showingItems.length) return;
            vueApp.equip.showingItems.fill(extern.getItemsOfType(ItemType.Hat)[0]);
            setTimeout(vueApp.$refs.equipScreen.setupItemGridMain);
        };
    
        switch (vueApp.currentEquipMode) {
            case inventory:
            case skins:
            case null:
                refreshItemGrid();
                break;
            case featured:
                refreshItemGrid();
                // No break to fall through to shop case
            case shop:
                if (!(vueApp.equip.showUnVaultedItems.length || vueApp.equip.bundle.items.length)) break;
                vueApp.equip.showUnVaultedItems.fill(vueApp.equip.showUnVaultedItems[0]);
                vueApp.equip.bundle.items = [];
                setTimeout(() => {
                    vueApp.$refs.equipScreen.getVaultedItemsForGrid(true);
                    vueApp.equip.bundle.items = extern.catalog.findItemsByIds(extern.getActiveBundles()[0].itemIds);
                }, 0);
                break;
        }
    }

    refreshProfileScreen() {
        // Update Profile Screen
        if (vueApp.showScreen === vueApp.screens.profile) {
            vueApp.$refs.homeScreen.$refs.profileScreen.$forceUpdate(); 
            vueApp.$refs.homeScreen.$refs.profileScreen.$refs.statsContainer.$children.forEach(child => child.$forceUpdate());
        }
    }

    switchBetterUI(init) {
        if (extern.inGame) extern?.switchHitMarkerColor?.(extern.modSettingEnabled("betterUI_hitMarkers"));
        this.switchUITweaks(extern.modSettingEnabled("betterUI_ui"));
        this.switchBetterInv(extern.modSettingEnabled("betterUI_inventory"), init);
        this.refreshProfileScreen();
        unsafeWindow.megaMod.colorSlider.refreshColorSelect();
        this.switchRoundness(extern.modSettingEnabled("betterUI_roundness"));
        this.switchColored(extern.modSettingEnabled("betterUI_colors"));
        this.switchChlg(extern.modSettingEnabled("betterUI_chlg"));
        this.switchWeapons(extern.modSettingEnabled("betterUI_weapons"));
        this.switchDistance(extern.modSettingEnabled("betterUI_distance"));
        this.switchSpatula(extern.modSettingEnabled("betterUI_spatula"));
    }
}

class BetterChat {
    constructor() {
        Promise.all([
            MegaMod.addModCSS('betterChat/chatIcons'),
            MegaMod.addModCSS('betterChat/longerChat'),
            MegaMod.addModCSS('betterChat/infChat')
        ]).then(styles => {
            const [chatIconStyle, longChatStyle, infChatStyle] = styles;
            Object.assign(this, { chatIconStyle, longChatStyle, infChatStyle });
            setTimeout(this.switchBetterChat.bind(this), 250);
        });

        // Chat Auto Scroll + Translate
        const scrollChat = () => chatOut.scrollTop = chatOut.scrollHeight;
        const chatOut = document.getElementById('chatOut');
        new MutationObserver((mutations) => {
            if (extern.modSettingEnabled("betterChat_infChat") && !vueApp.game.isPaused) scrollChat();

            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('chat-item') && !node.classList.contains('chat-event') && node !== chatOut.firstElementChild) {
                        if (extern.modSettingEnabled("betterChat_translateChat")) this.handleNewChatMessage(node);
                        else if (extern.modSettingEnabled("betterChat_detectCodes")) this.detectAndLinkGameCodes(node);
                    }
                });
            });
        }).observe(chatOut, { childList: true });

        const oldRespawn = extern.respawn;
        extern.respawn = () => {
            oldRespawn.call(this);
            if (extern.modSettingEnabled("betterChat_infChat")) setTimeout(scrollChat, 250);
        };

        const oldSendChat = extern.sendChat;
        extern.sendChat = (...args) => {
            oldSendChat.apply(this, args);
            if (extern.modSettingEnabled("betterChat_infChat")) setTimeout(scrollChat, 250);
        };

        const oldSpectate = extern.enterSpectatorMode;
        extern.enterSpectatorMode = () => {
            oldSpectate.call(this);
            if (extern.modSettingEnabled("betterChat_infChat")) setTimeout(scrollChat, 250);
        };

        const oldSwitchToHomeUi = vueApp.switchToHomeUi;
        vueApp.switchToHomeUi = function() {
           //if (vueApp.currentEquipMode === vueApp.equipMode.inventory && this.itemVaultEnabled) this.$refs.equipScreen.onSwitchToVaultClicked(false);
            oldSwitchToHomeUi.call(this);
            this.$nextTick(()=> {
                if (this.leaveToJoinGame) {
                    this.openGameCode(this.leaveToJoinGameCode, true);
                    this.onLeaveGameResetJoinGame();
                }
            });
        }
    }

    switchBetterChat() {
        this.switchChatIcons(extern.modSettingEnabled("betterChat_chatIcons"));
        this.switchLongerChat(extern.modSettingEnabled("betterChat_longerChat"));
        this.switchInfChat(extern.modSettingEnabled("betterChat_infChat"));
        this.switchChatEvents();
    }

    switchChatIcons(enabled) {
        this.chatIconStyle.disabled = !enabled;
    }

    switchLongerChat(enabled) {
        this.longChatStyle.disabled = !enabled;
        this.adjustChatLength();
    }

    switchInfChat(enabled) {
        this.infChatStyle.disabled = !enabled;
        if (!enabled) this.adjustChatLength();
    }

    adjustChatLength() {
        if (extern.modSettingEnabled("betterChat_infChat")) return;
        const chatItems = Array.from(document.getElementById("chatOut").querySelectorAll(".chat-item"));
        const maxLength = extern.modSettingEnabled?.("betterChat_longerChat") ? 7 : 5;
        chatItems.slice(0, Math.max(0, chatItems.length - maxLength)).forEach(item => item.remove());
    }

    switchChatEvents() {
        Object.entries(ChatEventData).forEach(([type, v]) => this.switchChatEvent(type, extern.modSettingEnabled(v.setting)));
    }

    switchChatEvent(type, enabled) {
        const chatItems = Array.from(document.getElementById("chatOut").querySelectorAll(`.chat-item.type-${type}`));
        chatItems.forEach(item => item.style.setProperty("display", enabled ? "" : "none", 'important'));
        this.adjustChatLength();
    }

    async translateText(originalText, targetLang, sourceLang = 'auto') {
        try {
            // translate
            //MegaMod.log("BetterChat - translateText()", `Translating ${originalText}`);
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURI(originalText)}`);
            const data = await response.json();

            const sameLanguage = data?.[2] === targetLang && data?.[0]?.[0]?.[7]?.[0]?.[1] !== "offline";
            const translatedText = data?.[0]?.[0]?.[0];
            const sameText = translatedText.toLowerCase() === originalText.toLowerCase();
            if(!(sameLanguage || sameText)) return translatedText;
        } catch (error) {
            console.error('Error during translation:', error);
        }
        return null;
    }

    getTextSpan(elem) {
        const spans = elem.querySelectorAll('span');
        return spans[spans.length - 1];
    }

    async handleNewChatMessage(msgElem) {
        const autoTranslate = extern.modSettingEnabled("betterChat_autoTranslate");
        const detectCodes = extern.modSettingEnabled("betterChat_detectCodes");
        const langMap = { "zh": "zh-CN" };
        const textSpan = this.getTextSpan(msgElem);

        const translateChatMessage = async (elem) => {
            const originalText = textSpan.innerText;

            // Extract game codes from the original text and temporarily remove them
            const gameCodes = [];
            const textWithoutCodes = originalText.replaceAll(/#?([A-Za-z]{4}-[A-Za-z]{4}-[A-Za-z]{4})\b/g, (match, code) => {
                gameCodes.push({ full: match, code }); // Store full match and raw code
                return `__${gameCodes.length - 1}__`; // Use placeholder
            });

            // Translate the message without game codes
            const translatedText = await this.translateText(textWithoutCodes, langMap[vueApp.currentLanguageCode] || vueApp.currentLanguageCode);
            //MegaMod.log("BetterChat - handleNewChatMessage()", (!translatedText ? "Not " : "") + `Translatated` + (translatedText ? ` : ${translatedText}` : ""));
            if (!translatedText) {
                if (detectCodes) this.detectAndLinkGameCodes(elem);
                return;
            }

            // Reinstate the game codes in the translated text (case insensitive)
            let finalTranslatedText = translatedText;
            gameCodes.forEach(({ full }, index) => finalTranslatedText = finalTranslatedText.replace(`__${index}__`, full));

            // Update the message in the DOM with translated text
            Object.assign(elem.dataset, {
                original: originalText,
                translated: finalTranslatedText,
                showingTranslated: autoTranslate
            });
            textSpan.innerHTML = finalTranslatedText;

            // Run detectAndLinkGameCodes on both original and translated dataset properties if needed
            if (detectCodes) this.detectAndLinkGameCodes(elem);

            return translatedText;
        }

        // Return if auto translation isn't valid
        if (autoTranslate) {
            if (!await translateChatMessage(msgElem)) return;
        } else if (detectCodes) {
            this.detectAndLinkGameCodes(msgElem);
        }

        const playSFX = (translated) => BAWK.play(translated ? "ui_reset" :  "ui_equip");

        const icon = document.createElement('i');
        icon.className = `fas6 fa-language translate-icon ${autoTranslate ? "translated" : "original"}`;
        icon.addEventListener('click', async function(e) {
            e.stopPropagation();
            // If not translated, remove icon
            if (!(msgElem.dataset.original || await translateChatMessage(msgElem))) {
                playSFX(true);
                return this.remove();
            }
            const showingTranslated = msgElem.dataset.showingTranslated === "true";
            playSFX(showingTranslated);
            textSpan.innerHTML = showingTranslated ? msgElem.dataset.original : msgElem.dataset.translated;
            msgElem.dataset.showingTranslated = !showingTranslated;

            icon.classList.toggle("original", showingTranslated);
            icon.classList.toggle("translated", !showingTranslated);
        });
        msgElem.appendChild(icon);
    }

    detectAndLinkGameCodes(msgElem) {
        const replaceGameCodes = (text) => {
            return text.replace(/#?([A-Za-z]{4}-[A-Za-z]{4}-[A-Za-z]{4})\b/g, (match, code) => {
                const upperCode = code.toUpperCase();
                const display = match.startsWith('#') ? `#${upperCode}` : upperCode;
                return `<span class="game-code-link" onclick="vueApp.handleGameCodeClick(event, '${upperCode}');">${display}</span>`;
            });
        };
        const textSpan = this.getTextSpan(msgElem);
        if (textSpan?.innerHTML) textSpan.innerHTML = replaceGameCodes(textSpan.innerHTML);
        ['original', 'translated'].forEach(key => {
            const text = msgElem.dataset[key];
            if (text) msgElem.dataset[key] = replaceGameCodes(text);
        });
    }

    highlightBlacklist(input, blacklistFunc) {
        const n = input.length;
        const allRanges = [];

        // Find all blacklisted substrings
        for (let start = 0; start < n; start++) {
            for (let end = start + 1; end <= n; end++) {
                const substr = input.slice(start, end);
                if (blacklistFunc(substr)) allRanges.push([start, end]);
            }
        }

        // Sort by start ascending, then length ascending
        allRanges.sort((a, b) => {
            if (a[0] !== b[0]) return a[0] - b[0];
            return (a[1] - a[0]) - (b[1] - b[0]);
        });

        // Filter out any range fully containing another
        const filtered = [];
        for (let i = 0; i < allRanges.length; i++) {
            const [startI, endI] = allRanges[i];
            let isContained = false;
            for (let j = 0; j < allRanges.length; j++) {
                if (i === j) continue;
                const [startJ, endJ] = allRanges[j];
                if (startI <= startJ && endI >= endJ && (startI !== startJ || endI !== endJ)) {
                    isContained = true;
                    break;
                }
            }
            if (!isContained) filtered.push(allRanges[i]);
        }

        // Merge overlapping or adjacent filtered ranges
        filtered.sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (const [start, end] of filtered) {
            if (merged.length === 0 || merged[merged.length - 1][1] < start) {
                merged.push([start, end]);
            } else {
                merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
            }
        }

        // Build result string with <b> tags
        let result = '';
        let lastIdx = 0;
        for (const [start, end] of merged) {
            result += input.slice(lastIdx, start);
            result += `<span class="chat-highlight">${input.slice(start, end)}</span>`;
            lastIdx = end;
        }
        result += input.slice(lastIdx);

        return result;
    }
}

class ColorSlider {   
    constructor() {
        MegaMod.log("Initializing Mod:", "VIP Color Slider");

        unsafeWindow.shellColors[14] = localStore.getItem('colorSlider_hex') || "#00FFFF";
        const oldSetColor = extern.setShellColor;
        Object.assign(extern, {
            useSliderColor() {
                const sub = extern.account.isSubscriber;
                extern.account.isSubscriber = true;
                extern.setShellColor(14);
                extern.account.isSubscriber = sub;
            },
            setSliderColor(hex) {
                shellColors[14] = hex;
                this.useSliderColor();
            },
            usingSlider() {
                return this.modSettingEnabled("colorSlider_unlock") || vueApp.isUpgraded;
            },
            setShellColor(colorIdx) {
                document.documentElement.style.setProperty('--slider-accent-color', `var(${(this.usingSlider() && colorIdx === 14) ? "--ss-white" : "--ss-blue3"})`);
                oldSetColor.call(this, colorIdx);
            }
        });
        const oldAuthCompleted = vueApp.authCompleted;
        vueApp.authCompleted = function() {
            oldAuthCompleted.call(this);
            if (extern.usingSlider() && extern.modSettingEnabled("colorSlider_autoSave")) extern.useSliderColor();
        };
       if (extern?.account?.colorIdx != null && extern.usingSlider() && extern.modSettingEnabled("colorSlider_autoSave")) extern.useSliderColor();
    }

    refreshColorSelect() {
        if (vueApp.showScreen === vueApp.screens.equip) vueApp.$refs.equipScreen.$refs.colorSelect.$forceUpdate(); // Update Color Select
    }
}

class LegacyMode {   
    static itemIds = [3000, 3100, 3400, 3600, 3800, 4000, 4200];

    constructor(legacySounds) {
        MegaMod.log("Initializing Mod:", "Legacy Mode");

        this.legacySounds = legacySounds;
        const soundsInterval = setInterval(() => {
            const sounds = Object.values(BAWK?.sounds || {});
            if (!sounds.length || !sounds[0]?.buffer) return;
            clearInterval(soundsInterval);
            Promise.all(this.getAllLegacySounds().map(s => {
                BAWK.sounds[`${s}_Default`] = BAWK.sounds[s];
                return BAWK.loadSound(`${rawPath}/sfx/legacy/${s}.mp3`, `${s}_Legacy`);
            })).then(() => {
                if (extern.modSettingEnabled("legacyMode_sfx")) this.switchLegacySounds(true);
            });
        }, 250);
        
        const trySwitchLegacySkins = () => {
            if (!extern.modSettingEnabled("legacyMode_skins")) return;
            vueApp.$refs.equipScreen.updateEquippedItems();
            this.switchLegacySkins(true);
        };
        const skinsInterval = setInterval(() => {
            if (extern?.account?.colorIdx == null) return;
            clearInterval(skinsInterval);
            if (extern.account?.firebaseId) setTimeout(trySwitchLegacySkins, 500);
        }, 500);

        const oldAssetSetup = vueApp.assetSetup;
        vueApp.assetSetup = function(totalAssets) {
            oldAssetSetup.call(this, totalAssets);
            if (totalAssets !== this.ui.homeToGameProgressBar.nonAccountTotal) return;
            const assetInterval = setInterval(() => {
                if (this.ui.homeToGameProgressBar.loadedAssets < totalAssets) return;
                clearInterval(assetInterval);
                trySwitchLegacySkins();
            });
        };
    }

    getAllLegacySounds(obj = this.legacySounds) {
        const values = [];
        for (const key in obj) {
            if (Array.isArray(obj[key])) {
                values.push(...obj[key]);
            } else if (typeof obj[key] === 'object') {
                values.push(...this.getAllLegacySounds(obj[key]));
            }
        }
        return values;
    }

    switchLegacySounds(enabled) {
        this.getAllLegacySounds().forEach(s => {
            const sound = BAWK.sounds[s];
            const defaultSound = BAWK.sounds[`${s}_Default`];
            if (sound.buffer.duration === defaultSound.buffer.duration && sound.buffer.length === defaultSound.buffer.length) return;
            BAWK.sounds[s] = defaultSound;
        });

        const settingsPrefix = "legacyMode_sfx_";
        const selectedSounds = [];
        ["cluck9mm", "eggk47", "dozenGauge", "csg1", "rpegg", "smg", "m24"].forEach(gun => {
            const gunPrefix = settingsPrefix + gun;
            if (enabled && extern.modSettingEnabled(`${gunPrefix}_defaultonly`)) {
                BAWK.sounds[`gun_${gun}_Legacy_fire`] = BAWK.sounds[`gun_${gun}_fire_Legacy`];
            } else {
                delete BAWK.sounds[`gun_${gun}_Legacy_fire`];
            }
            if (!(enabled && extern.modSettingEnabled(`${gunPrefix}_enabled`))) return;
            if (extern.modSettingEnabled(`${gunPrefix}_fire`) && !extern.modSettingEnabled(`${gunPrefix}_defaultonly`)) selectedSounds.push(...this.legacySounds.guns[`gun_${gun}`].fire);
            if (extern.modSettingEnabled(`${gunPrefix}_reload`)) selectedSounds.push(...this.legacySounds.guns[`gun_${gun}`].reload);
        });

        if (enabled && extern.modSettingEnabled(`${settingsPrefix}gexplode`) && extern.modSettingEnabled(`${settingsPrefix}defaultgexplode`)) {
            extern.catalog.findItemById(16000).item_data.sound = "grenade_Legacy";
        } else {
            delete extern.catalog.findItemById(16000).item_data.sound;
        }
        if (!enabled) return;
        if (extern.modSettingEnabled(`${settingsPrefix}pickup`)) selectedSounds.push(...this.legacySounds.pickup);
        if (extern.modSettingEnabled(`${settingsPrefix}swap`)) selectedSounds.push(...this.legacySounds.weapon_swap);
        if (extern.modSettingEnabled(`${settingsPrefix}gbeep`)) selectedSounds.push(...this.legacySounds.grenade_beep);
        if (extern.modSettingEnabled(`${settingsPrefix}gthrow`)) selectedSounds.push(...this.legacySounds.grenade_pin);
        if (extern.modSettingEnabled(`${settingsPrefix}gexplode`) && !extern.modSettingEnabled(`${settingsPrefix}defaultgexplode`)) selectedSounds.push(...this.legacySounds.grenade);
        
        selectedSounds.forEach(s => {
            const sound = BAWK.sounds[s];
            const typeSound = BAWK.sounds[`${s}_${enabled ? 'Legacy' : 'Default'}`];
            if (sound.buffer.duration === typeSound.buffer.duration && sound.buffer.length === typeSound.buffer.length) return;
            BAWK.sounds[s] = typeSound;
        });
    }
    
    switchLegacySkins(enabled) {
        extern.catalog.findItemsByIds(LegacyMode.itemIds).forEach(item => {
            item.name = (enabled) ? item.name.replace(" ", " Legacy ") : item.name.replace(" Legacy ", " ");
            const meshName = item.item_data.meshName;
            extern?.updateLegacyIcons?.(enabled, meshName)
            if (enabled) {
                item.item_data.meshName += (!meshName.includes("_Legacy")) ? "_Legacy" : "";
            } else {
                item.item_data.meshName = item.item_data.meshName.replace("_Legacy", "");
            }
        });
        if (extern.inGame) extern?.updateLegacySkinsInGame?.(enabled);
        // POV: too lazy to think of something better :D
        if (vueApp.equip.showingItems && vueApp.currentEquipMode === vueApp.equipMode.inventory && !([ItemType.Grenade, ItemType.Melee].includes(vueApp.$refs.equipScreen.equip.showingWeaponType) || vueApp.classIdx === CharClass.TriHard)) {
            const origItems = vueApp.$refs.equipScreen.equip.showingItems;
            vueApp.$refs.equipScreen.equip.showingItems = Array.from({ length: origItems.length }, () => extern.getItemsOfType(ItemType.Hat)[0]);
            setTimeout(() => vueApp.$refs.equipScreen.equip.showingItems = origItems, 0);
        }

        if ((vueApp.currentEquipMode === vueApp.equipMode.inventory || vueApp.currentEquipMode == null) && vueApp.game.isPaused) {
            [ItemType['Melee'], ItemType['Grenade'], vueApp.equip.selectedItemType].forEach(type => {
                vueApp.equip.showingWeaponType = type;
                vueApp.$refs.equipScreen.poseEquippedItems();
            });
        }
    }

    selectedLegacyGun(gun) {
        return gun === unsafeWindow.megaMod.getModSettingById('legacyMode_weaponSelect').value;
    }

    legacyDefaultOnly(item) {
        const gun = item.item_data.meshName.split("_")[1];
        return  item.unlock === "default" && extern.catalog.findItemsByIds(LegacyMode.itemIds).map(i => i.item_data.meshName.split("_")[1]).includes(gun) && extern.modSettingEnabled('legacyMode_sfx') && extern.modSettingEnabled(`legacyMode_sfx_${gun}_enabled`) && extern.modSettingEnabled(`legacyMode_sfx_${gun}_defaultonly`);
    }
}

class HideHUD {   
    constructor(hudElemSelectors) {
        MegaMod.log("Initializing Mod:", "Hide HUD");

        this.hudElemSelectors = hudElemSelectors;
        this.hudHidden = false;
        vueApp.$refs.gameScreen.updateSpectateControls();

        const tryHideHUD = () => {
            const hideHUDErr = ["hideHUD", "hideHUD_keybind"].some(settingId => unsafeWindow.megaMod.modErrs.includes(settingId));
            if (extern.modSettingEnabled("hideHUD") && !hideHUDErr) this.updateHUDVisibility(this.hudHidden);
        };

        const oldRespawn = extern.respawn;
        extern.respawn = () => {
            tryHideHUD();
            oldRespawn.call(this);
        };

        const oldSpectate = extern.enterSpectatorMode;
        extern.enterSpectatorMode = () => {
            oldSpectate.call(this);
            tryHideHUD();
        };
        
        const oldChallengeMsg = vueApp.challengeMsg;
        vueApp.challengeMsg = function(...args) {
            if (extern.modSettingEnabled("hideHUD_gametext") && unsafeWindow?.megaMod?.hideHUD?.hudHidden) return;
            oldChallengeMsg.apply(this, args);
        }
    }
    
    getHUDElems() {
        return Object.entries(this.hudElemSelectors)
        .filter(([id, _]) => !this.hudHidden || extern.modSettingEnabled(`hideHUD_${id}`))
        .flatMap(([_, selectors]) => selectors)
        .flatMap(selector => Array.from(document.querySelectorAll(selector))).filter(Boolean);
    }

    toggleHideHUD(disable) {
        this.updateHUDVisibility(this.hudHidden = disable ? false : !this.hudHidden);
    }

    disableHideHUD() {
        if (this.hudHidden) this.toggleHideHUD(true);
    }

    updateHUDVisibility(hidden) {
        const messageLoc = hidden ? 'megaMod_hideHUD_hidden' : 'megaMod_hideHUD_showing';
        if (!vueApp.game.isPaused && hidden === this.hudHidden) vueApp.$refs.gameScreen.showInGameNotif(messageLoc);
        this.getHUDElems().forEach(e => e.style.opacity = hidden ? 0 : 1);
        if (!hidden || extern.modSettingEnabled("hideHUD_nametags")) extern?.hideNametags?.(hidden);
        if (!hidden || extern.modSettingEnabled("hideHUD_outlines")) extern?.hideOutlines?.(hidden);
        if (extern.inGame && (!hidden || extern.modSettingEnabled("hideHUD_pickups"))) extern?.hidePickups?.(hidden);

        if (hidden) {
            if (this.hudInterval) clearInterval(this.hudInterval);
            this.hudInterval = setInterval(() => {
                if (!vueApp.game.isPaused) return;
                clearInterval(this.hudInterval);
                this.updateHUDVisibility(false);
            }, 100);
        }
    }
}

class KillstreakStats {   
    constructor() {
        MegaMod.log("Initializing Mod:", "Killstreak Stats");

        const oldRespawn = extern.respawn;
        extern.respawn = () => {
            oldRespawn.call(this);
            this.startTimer();
        };
    }

    startTimer() {
        const timer = document.getElementById("playTimer");
        if (!(extern.modSettingEnabled("killstreakInfo_timer") && timer && document.getElementById("healthHp"))) return;
        const startTime = new Date().getTime();
        const timerInterval = setInterval(() => {
            if (vueApp.game.respawnTime) {
                clearInterval(timerInterval);
                return;
            }
            const elapsedTime = (new Date().getTime() - startTime) / 1000;
            const minutes = Math.floor(elapsedTime / 60);
            const hours = Math.floor(minutes / 60);
            timer.innerHTML = `${(hours > 0 ? String(hours).padStart(hours > 10 ? 2 : 1, "0") + ":" : "") + (minutes % 60).toString().padStart(minutes > 10 ? 2 : 1, "0")}:${(elapsedTime % 60).toFixed(3).padStart(6, "0")}`;
        }, 1);
    }
}

class MatchGrenades {   
    constructor() {
        MegaMod.log("Initializing Mod:", "Match Grenades");

        const oldPause = vueApp.setPause;
        vueApp.setPause = function(...args) {
            oldPause.apply(this, args);
            extern?.tryUpdateGrenades?.();
            vueData.ui.game.spectatingPlayerName = null;
        };
    }
}

// TODO: Make this less glitchy :(
class ChangeFPS {   
    static oldRAF = unsafeWindow.requestAnimationFrame;

    constructor() {
        MegaMod.log("Initializing Mod:", "Change FPS");

        this.animCallbacks = [];
        this.newRAF = (cb) => this.animCallbacks.push(cb);

        // Set FPS Default Value
        /*
        // This is too buggy
        (() => {
            return new Promise((resolve) => {
                const frameTimes = [];
                let lastFrameTime = performance.now();
                function frame(time) {
                    const delta = time - lastFrameTime;
                    lastFrameTime = time;
                    frameTimes.push(delta);
                    if (frameTimes.length > 60) {
                        frameTimes.shift();
                        resolve(Math.round(1000 / (frameTimes.reduce((a, b) => a + b) / frameTimes.length)));
                        return;
                    }
                    requestAnimationFrame(frame);
                }
                requestAnimationFrame(frame);
            });
        })().then(fps => {
            const setting = unsafeWindow.megaMod.getModSettingById("changeFPS_slider");
            //setting.defaultVal = Math.round(itemRenderer.scene._engine._fps);
            setting.defaultVal = fps;
            this.setFPS(unsafeWindow.megaMod.getModSettingById("changeFPS_slider").value);
        });
        */ 
        this.setFPS(unsafeWindow.megaMod.getModSettingById("changeFPS_slider").value);
    }

    setFPS(fps) {
        this.fps = fps;
        if (extern.modSettingEnabled("changeFPS")) this.enableFPS();
    }

    enableFPS() { 
        unsafeWindow.requestAnimationFrame = this.newRAF; 
        if (this.fpsChangeInterval) clearInterval(this.fpsChangeInterval);
        this.fpsChangeInterval = setInterval(() => {
            const callbacks = [...this.animCallbacks];
            this.animCallbacks.length = 0;
            callbacks.forEach(f => f(document.timeline.currentTime));
        }, 1000 / this.fps);
    }

    disableFPS() {
        unsafeWindow.requestAnimationFrame = ChangeFPS.oldRAF; 
    }
}

class SpectateTweaks {   
    constructor() {
        MegaMod.log("Initializing Mod:", "Spectate Tweaks");

        this.freezeFrame = false;
        extern.getSpecSpeed = () => extern.modSettingEnabled("specTweaks") ? (unsafeWindow.megaMod.getModSettingById("specTweaks_speed").value / 100) : 1;
    }

    toggleFreezeFrame() {
        extern.freezeFrame(this.freezeFrame = !this.freezeFrame);
        if (this.freezeFrame) {
            if (this.freezeInterval) clearInterval(this.freezeInterval);
            this.freezeInterval = setInterval(() => {
                if (vueApp.ui.game.spectate) return;
                clearInterval(this.freezeInterval);
                extern?.freezeFrame?.(this.freezeFrame = false);
            }, 100);
        }
    }
}

class PhotoboothEggSpin {   
    constructor() {
        MegaMod.log("Initializing Mod:", "Photobooth Egg Spin");
    }

    setupGIF() {
        const workerScript = `
            self.onmessage = function (event) {
                importScripts('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
                self.onmessage = null;
                self.postMessage(event.data);
            };
        `;
        const workerURL = URL.createObjectURL(new Blob([workerScript], { type: 'application/javascript' }));
        
        this.pbSpinGif = new GIF({
            workers: 8,
            quality: 10,
            debug: true,
            workerScript: workerURL
        });
        this.pbSpinGif.on('finished', function(blob) {
            // Create an image element to display the GIF
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            document.body.appendChild(img);
            
            // Optionally, you can create a download link
            const link = document.createElement('a');
            link.href = img.src;
            link.download = 'spin.gif';
            document.body.appendChild(link);
            link.click();
            MegaMod.log("pbSpin:", "DONE WITH IMAGE!");
            open(URL.createObjectURL(blob));
        });
    }

    captureFrame(delay, lastFrame) {
        const canvasCtx = document.createElement("canvas").getContext("2d");
        const settings = { allowTaint: false, logging: false, backgroundColor: null };
        const innerWidth = unsafeWindow.innerWidth;
        const halfWidth = innerWidth / 2;
        const innerHeight = unsafeWindow.innerHeight;
        
        html2canvas(document.body, settings).then(res => {
            const noBg = !vueApp.$refs.photoBooth._data.bgIdx;
            if (noBg) {
                if (!this.pbSpinGif.options.transparent) this.pbSpinGif.options.transparent = true;
                canvasCtx.canvas.width = halfWidth;
                canvasCtx.canvas.height = innerHeight;
                canvasCtx.drawImage(res, -Math.max(0, (innerWidth - halfWidth) / 2 || 0), -(+canvasCtx.y || 0));
            }
            this.pbSpinGif.addFrame(noBg ? canvasCtx.canvas : res, { delay });
            if (lastFrame) this.pbSpinGif.render();
        });
    }
}

class CustomTheme {   
    constructor(themes) {
        MegaMod.log("Initializing Mod:", "Custom Theme");

        Object.assign(this, { themes });
        this.themes.forEach(theme => {
            theme.url = theme.url || `/themes/css/${theme.id}.css`;
            const preload = unsafeWindow.megaMod.modSettingEnabled("themeManager_preload", true);
            const style = document.createElement(preload ? 'style' : 'link');
            style.id = `themeCSS-${theme.id}`;
            const disabled = !(unsafeWindow.megaMod.modSettingEnabled("themeManager") && theme.id === unsafeWindow.megaMod.getModSettingById("themeManager_themeSelect").value);
            if (preload) {
                MegaMod.fetchCSS(theme.url)
                    .then(css => {
                        document.body.appendChild(style).textContent = css;
                        style.disabled = disabled;
                    });
            } else {
                Object.assign(style, { rel: 'stylesheet', href: !theme.url.startsWith('http') ? `${cdnPath}${theme.url}` : theme.url, disabled: disabled });
                document.body.appendChild(style);
            }
        });
    }

    onThemeChanged(enabled, themeId) {
        this.themes.forEach(theme => document.getElementById(`themeCSS-${theme.id}`).disabled = !enabled || theme.id !== themeId);
        this.setThemeDesc();
    }
    
    setThemeDesc() {
        const themeDescInterval = setInterval(() => {
            const descElem = document.getElementById('themeDesc');
            if (!descElem) return;
            clearInterval(themeDescInterval);
            descElem.innerHTML = vueApp.loc[this.themes.find(t => t.id === unsafeWindow.megaMod.getModSettingById('themeManager_themeSelect').value).locKey];
        }, 50);
    }
}

class CustomSkybox {   
    constructor(skyboxes) {
        MegaMod.log("Initializing Mod:", "Custom Skybox");

        this.skyboxes = skyboxes;
        this.usingSkyboxColor = false;

        extern.getSkybox = (skybox = unsafeWindow.megaMod.getModSettingById("customSkybox_skyboxSelect").value) => {
			const skyboxCategory = unsafeWindow.megaMod.getModSettingById("customSkybox_skyboxCategorySelect").value;
            if (skyboxCategory === 'colors') return null;
			let skyboxURL = this.skyboxes[skyboxCategory].find(s => s.id === skybox)?.path || `${skyboxCategory}/${skybox}`;
			if (skyboxURL.startsWith('shellshock.io')) skyboxURL = skyboxURL.replace(`shellshock.io`, unsafeWindow.location.origin);
			if (!skyboxURL.startsWith('http')) skyboxURL = `${rawPath}/img/skyboxes/${skyboxURL}`;
			return skyboxURL;
		};
        this.onSkyboxCategoryChanged(unsafeWindow.megaMod.getModSettingById('customSkybox_skyboxCategorySelect').value, true);
    }

    setMapSkybox(mapSkybox) {
        this.mapSkybox = mapSkybox;
    }

    updateSkyboxPreview() {
        const skyboxPath = extern.getSkybox();
        const layout = {
            py: [0, 1],
            nx: [1, 0],
            pz: [1, 1],
            px: [1, 2],
            nz: [1, 3],
            ny: [2, 1],
        };

        const skyboxPreviewInterval = setInterval(() => {
            const previewElem = document.getElementById('skyboxPreview');
            if (!previewElem) return;
            clearInterval(skyboxPreviewInterval);
            previewElem.innerHTML = ''; // Clear previous preview
            Object.entries(layout).forEach(([dir, [row, col]]) => {
                const img = document.createElement('img');
                img.src = `${skyboxPath}/skybox_${dir}.jpg`;
                Object.assign(img.style, {
                    gridRowStart: row + 1,
                    gridColumnStart: col + 1
                });
                previewElem.appendChild(img);
            });
        }, 50);
    }

    onSkyboxCategoryChanged(value, init=false) {
        this.usingSkyboxColor = value === "colors";
        let hex;
        if (this.usingSkyboxColor) {
            hex = unsafeWindow.megaMod.getModSettingById('customSkybox_color').value;
        } else {
            const select = unsafeWindow.megaMod.getModSettingById('customSkybox_skyboxSelect');
            select.options = this.skyboxes[value];
            if (!init) unsafeWindow.megaMod.updateModSetting(
                "customSkybox_skyboxSelect", 
                extern.modSettingEnabled("customSkybox_randomSkybox") ? select.options.getRandom().id : select.options[0].id
            );
            this.updateSkyboxPreview();
        }
        extern?.updateSkybox?.(extern.modSettingEnabled("customSkybox"), hex);
    }

    randomizeSkybox() {
        const categorySetting = unsafeWindow.megaMod.getModSettingById("customSkybox_skyboxCategorySelect");
        unsafeWindow.megaMod.updateModSetting("customSkybox_skyboxCategorySelect", categorySetting.options.getRandom().id);
        if (categorySetting.value === "colors") unsafeWindow.megaMod.updateModSetting("customSkybox_color", MegaMod.getRandomHex());
        this.onSkyboxCategoryChanged(categorySetting.value);
    }
}

class CustomFog {
    constructor() { 
        MegaMod.log("Initializing Mod:", "Custom Fog");

        this.fog = { density: 0, color: "#FFF"}; 
        this.inGame = false;

        extern.resetFog = () => {
            if (!extern.inGame) return;
            BAWK.play("ui_reset");
            unsafeWindow.megaMod.updateModSetting("customFog_density", this.fog.density * 100);
            unsafeWindow.megaMod.updateModSetting("customFog_color", this.fog.color);
            extern?.updateFog?.(
                extern.modSettingEnabled("customFog"),
                this.fog.density,
                this.fog.color
            );
        };        
    }

    initFog(fog) {
        this.fog = fog;
        if (extern.modSettingEnabled("customFog_randomizeFog")) {
            const densitySetting = unsafeWindow.megaMod.getModSettingById('customFog_density');
            unsafeWindow.megaMod.updateModSetting(densitySetting.id, Math.randomInt(densitySetting.min, densitySetting.max + 1));
            unsafeWindow.megaMod.updateModSetting("customFog_color", MegaMod.getRandomHex());
        }
        if (extern.modSettingEnabled("customFog")) extern?.updateFog?.(
            true,
            unsafeWindow.megaMod.getModSettingById('customFog_density').value / 100, 
            unsafeWindow.megaMod.getModSettingById('customFog_color').value,
        );
    }
}

class BetterEggforce {
    static BAN_HISTORY_KEY = "megaMod_banHistory_list_{0}"
    constructor(data) {
        MegaMod.log("Initializing Mod:", "Better Eggforce");

        this.specESP = false;
        Object.assign(this, data);
        Object.assign(vueData, data);

        const playerAccount = extern.account.constructor;
        const { 
            signedIn: oldSignedIn, 
            loggedOut: oldLoggedOut
        } = playerAccount.prototype;
        Object.assign(playerAccount.prototype, {
            signedIn(...args) {
                oldSignedIn.apply(this, args);
                if (unsafeWindow.megaMod?.betterEggforce) unsafeWindow.megaMod.betterEggforce.initBanHistory();
            },
            loggedOut(...args) {
                oldLoggedOut.apply(this, args);
                vueApp.banHistory = [];
            },
        });

        this.initBanHistory();
        vueApp.$refs.gameScreen.updateSpectateControls();
    }

    getBanHistoryKey() {
        return BetterEggforce.BAN_HISTORY_KEY.format(extern.account.id);
    }

    updatePlayPanel() {
        const playPanel = vueApp?.$refs?.homeScreen?.$refs?.playPanel;
        if (playPanel) playPanel.$forceUpdate();
    }

    initBanHistory() {
        const history = JSON.parse(localStore.getItem(this.getBanHistoryKey()));
        if (history) {
            vueApp.banHistory = history;
            if (vueApp.banHistory.length) vueApp.selectFirstBan();
        }
        //this.checkBanHistory(); // Bugged 
        this.updatePlayPanel();
    }

    checkBanHistory() {
        vueApp.banHistory.filter(game => game.isOpen).forEach(historyItem => {
            const savedGame = vueApp.gameHistory.find(game => game.gameCode === historyItem.gameCode);
            historyItem.isOpen = savedGame?.isOpen ?? false;
        });
        this.saveBanHistory();
    }

    closeBanGames(gameCode) {
        const banEntries = vueApp.banHistory.filter(ban => ban.gameCode === gameCode);
        banEntries.forEach(ban => ban.isOpen = false);
        this.saveBanHistory();
    }

    saveBanHistory() {
        localStore.setItem(this.getBanHistoryKey(), JSON.stringify(vueApp.banHistory));
    }

    toggleSpecESP() {
        if (![2, 4, 8192].some(role => extern.adminRoles & role)) return;
        extern?.toggleSpecESP?.(this.specESP = !this.specESP);
        if (this.specESP) {
            if (this.specESPInterval) clearInterval(this.specESPInterval);
            this.specESPInterval = setInterval(() => {
                if (vueApp.ui.game.spectate) return;
                clearInterval(this.specESPInterval);
                extern?.toggleSpecESP?.(this.specESP = false);
            }, 100);
        }
    }

    getAutoBanList() {
        return unsafeWindow.megaMod.getModSettingById("betterEggforce_autoBan_list").value;
    }
}

class CustomCrosshair {
    constructor(scopes) {
        Object.assign(this, { scopes, crosshairStyles: {} });

        this.getCrosshairTypes().forEach(type => {
            this.crosshairStyles[type] = MegaMod.addModCSS(`customCrosshair/${type}`);
            setTimeout(() => this.initCrosshair(type), 250);
        });
    }

    getCrosshairTypes() {
        return unsafeWindow.megaMod.getModSettingById("customCrosshair_crosshairSelect").options.map(option => option.id);
    }

    setAttr(type, attr, val) {
        const settingId = `${this.getBaseSetting(type)}_${attr}`;
        const attrEnabled = extern.modSettingEnabled(`${settingId}_enabled`, true);
        //console.log("attrEnabled", settingId, attrEnabled);

        if (val == null) val = unsafeWindow.megaMod.getModSettingById(settingId).value;
        if (!["rpgReady", "rpgNotReady"].includes(type) && !["opacity", "radius"].includes(attr) && !attrEnabled) val = ["sgNorm", "sgPowr"].includes(type) ? "transparent" : "none";
        else if (!["sgNorm", "sgPowr"].includes(type) && attr === "border") val = `solid 0.05em ${val}`;
        if (attr === "radius") val *= 0.5;
        if (["opacity", "radius"].includes(attr)) val += "%";
        if (attr === "url") val = `url(${val})`; // Not used by anything atm

        this.setCSSVar(`${this.getBaseCSSVar(type)}-${attr}`, val);
    }

    setAttrs(type, attrs) {
        attrs.forEach(attr => this.setAttr(type, attr));
    }

    getBaseSetting(type) {
        return `customCrosshair_${type}`;
    }

    getBaseCSSVar(type) {
        return type === "scope" ? "--scope-url" : `--crosshair-${type}`;
    }

    getCurrentScopeCSS() {
        return `url(${this.getScopeUrl(unsafeWindow.megaMod.getModSettingById("customCrosshair_scope").value)})`;
    }

    initCrosshair(type) {
        const baseSetting = this.getBaseSetting(type);

        if (type === "scope") {
            this.setCSSVar(this.getBaseCSSVar(type), this.getCurrentScopeCSS());
        } else {
            this.setAttrs(type, ["bg", "opacity"]);
            if (!["rpgReady", "rpgNotReady"].includes(type)) this.setAttr(type, "border");
            if (type !== "augNorm") this.setAttr(type, "radius");
        }
        this.enableCrosshairStyle(type, extern.modSettingEnabled(`${baseSetting}_enabled`));
    }

    enableCrosshairStyle(type, enabled) {
        this.crosshairStyles[type].disabled = !enabled;
        //console.log(type, "disabled", this.crosshairStyles[type].disabled);
    }

    setCSSVar(variable, value) {
        //console.log(variable, value);
        document.documentElement.style.setProperty(variable, value);
    }

    getScope(id) {
        return this.scopes.find(scope => scope.id === id);
    }

    getScopeUrl(id) {
        const scope = this.getScope(id);
        if (!scope) return "https://shellshock.io/img/scope.webp";
        if (scope.url) return scope.url;
        if (scope.theme) return `${rawPath}/themes/img/${scope?.scopePath || id}/scope.png`;
        return `${rawPath}/img/scopes/${id}.png`;
    }

    selectedCrosshair(type) {
        return type === unsafeWindow.megaMod.getModSettingById('customCrosshair_crosshairSelect').value;
    }

    onScopeChanged(scopeId) {
        this.setCSSVar(this.getBaseCSSVar("scope"), `url(${this.getScopeUrl(scopeId)})`);
        this.setScopeDesc();
        this.updateScopePreview();
    }
    
    setScopeDesc() {
        const scopeDescInterval = setInterval(() => {
            const descElem = document.getElementById('scopeDesc');
            if (!descElem) return;
            clearInterval(scopeDescInterval);
            const scope = this.getScope(unsafeWindow.megaMod.getModSettingById('customCrosshair_scope').value)
            descElem.innerHTML = vueApp.loc[scope.theme ? 'p_settings_mods_customCrosshair_scope_theme_desc' : scope.locKey];
            if (scope.theme) descElem.innerHTML = descElem.innerHTML.format(vueApp.loc[unsafeWindow.megaMod.getModSettingById("themeManager_themeSelect").options.find(theme => theme.id === scope.id).locKey]);
        }, 50);
    }

    updateScopePreview() {
        const scopePreviewInterval = setInterval(() => {
            const previewElem = document.querySelector('#scopePreview .overlay');
            if (!previewElem) return;
            clearInterval(scopePreviewInterval);
            previewElem.style.backgroundImage = this.getCurrentScopeCSS();
        }, 50);
    }
}

// No MegaMod during Map Test...womp womp
if (unsafeWindow.location.search.includes('testMap')) return;

MegaMod.setDebug(true); // Debug Logging
MegaMod.setLocal(false); // Local Testing
Object.assign(unsafeWindow, {
	SettingType: {
		Slider: 0,
		Toggler: 1,
		Keybind: 2,
		Select: 3,
		Group: 4,
		HTML: 5,
        Button: 6,
        ColorPicker: 7,
        TagInput: 8
	},
	PrettyChallengeType: {
		 0: "Kills",
		 1: "Damage",
		 2: "Deaths",
		 3: "Movement",
		 4: "Pickups",
		 5: "Timed",
		 6: "KoTC",
		 7: "CTS",
		 8: "FFA",
		 9: "Items",
		 10: "Eggs Earned",
		 11: "Shop"
	},
	PrettyChallengeSubType: {
		 0: "Killstreak",
		 1: "Weapon Type",
		 2: "Damage",
		 3: "Distance",
		 4: "Jumps",
		 5: "Map",
		 6: "Time Played",
		 7: "Time Alive",
		 8: "Condition",
		 9: "Color",
		 10: "Kills",
		 11: "Shot",
		 12: "Health",
		 13: "Scoped",
		 14: "Scope",
		 15: "Deaths",
		 16: "One-Shot",
		 17: "Reload",
		 18: "Pickups",
		 20: "Capturing",
		 21: "Capture",
		 22: "Contest",
		 23: "Win"
	},
	ChatEvent: {
		 joinGame: 0,
		 leaveGame: 1,
		 switchTeam: 2,
         pickSpatula: 3,
         dropSpatula: 4
	},
	teamLocs: ['team_blue', 'team_red'],
    BadgeMsgType: {
        coreGained: 0,
        coreLost: 1,
        tierUpgrade: 2,
        tierDowngrade: 3,
        tierLost: 4
    },
	rawPath: MegaMod.local ? "http://127.0.0.1:5500" : "https://raw.githubusercontent.com/InfiniteSmasher/The-MegaMod/main",
	cdnPath: MegaMod.local ? "http://127.0.0.1:5500" : "https://infinitesmasher.github.io/The-MegaMod",
});
Object.assign(unsafeWindow, {
    ChatEventData: {
        [ChatEvent.joinGame]: {
            locKey: 'megaMod_betterChat_chatEvent_joinGame',
            iconClass: "fas6 fa-person-running-fast",
            setting: 'betterChat_chatEvent_joinGame'
        },
        [ChatEvent.leaveGame]: {
            locKey: 'megaMod_betterChat_chatEvent_leaveGame',
            iconClass: "fas6 fa-person-running-fast fa-flip-horizontal",
            setting: 'betterChat_chatEvent_leaveGame'
        },
        [ChatEvent.switchTeam]: {
            locKey: 'megaMod_betterChat_chatEvent_switchTeam',
            iconClass: "fas6 fa-sync",
            setting: 'betterChat_chatEvent_switchTeam'
        },
        [ChatEvent.pickSpatula]: {
            locKey: 'megaMod_betterChat_chatEvent_pickSpatula',
            iconClass: "fas6 fa-fork",
            setting: 'betterChat_chatEvent_pickSpatula'
        },
        [ChatEvent.dropSpatula]: {
            locKey: 'megaMod_betterChat_chatEvent_dropSpatula',
            iconClass: "fas6 fa-fork",
            setting: 'betterChat_chatEvent_dropSpatula'
        }
    },
    BadgeMsgTypeData: {
        [BadgeMsgType.coreGained]: {
            locKey: 'megaMod_betterUI_coreBadgeGained_title',
            sfx: 'badgeLevelUp'
        },
        [BadgeMsgType.coreLost]: {
            locKey: 'megaMod_betterUI_coreBadgeLost_title',
            sfx: 'badgeLevelDown'
        },
        [BadgeMsgType.tierUpgrade]: {
            locKey: 'megaMod_betterUI_tierBadgeLvlUp_title',
            sfx: 'badgeLevelUp'
        },
        [BadgeMsgType.tierDowngrade]: {
            locKey: 'megaMod_betterUI_tierBadgeLvlDown_title',
            sfx: 'badgeLevelDown'
        },
        [BadgeMsgType.tierLost]: {
            locKey: 'megaMod_betterUI_tierBadgeLost_title',
            sfx: 'badgeLevelDown'
        }
    },
    openUpdate() {
        this.open(`${this.cdnPath}/js/script.user.js`);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") this.location.reload();
        });
    },
    megaMod: new MegaMod()
});

let shellshockJS = null;
const oldAppend = HTMLElement.prototype.appendChild;
HTMLElement.prototype.appendChild = function(child) {
    if (this.tagName === "BODY" && child.tagName === 'SCRIPT' && child?.innerHTML.startsWith('(()=>{')) {
        shellshockJS = child.innerHTML;
        child.innerHTML = MegaMod.editSource(child.innerHTML);
        HTMLElement.prototype.appendChild = oldAppend;
    };
    return oldAppend.call(this, child);
};

// ty op7
const scriptPrototype = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "textContent")
const oldTextContent = scriptPrototype || Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
if (oldTextContent) {
    const prototypeToModify = oldTextContent === scriptPrototype ? HTMLScriptElement.prototype : Node.prototype;
    Object.defineProperty(prototypeToModify, "textContent", {
        get() {
            const textContent = oldTextContent.get.call(this);
            return textContent?.startsWith('(()=>{') ? shellshockJS : textContent;
        },
        set: oldTextContent.set
    });
}

// Get random value in array
Array.prototype.getRandom = function() {
    return this[Math.floor(Math.random() * this.length)];
};

// Get Random Integer (e <= X < t)
Math.randomInt = function(e, t) {
    return Math.floor(Math.random() * (t - e) + e)
}

MegaMod.log("Script Loaded:", `Page Status - ${document.readyState}`);