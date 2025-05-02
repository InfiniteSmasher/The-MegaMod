class MegaMod {   
    static debug = false; // TODO: Add different debug levels
    static fatalErr = false;
    static KEYS = {
        InitFinished: "megaMod_initFinished",
        Updated: "megaMod_updated",
        ErrVersion: "megaMod_fatalErrorVersion",
        ErrReloads: "megaMod_errorReloads"
    };

    static setDebug(debug) {
        this.debug = debug;
    }

    static setFatalErr(fatalErr) {
        this.fatalErr = fatalErr;
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
                    <p v-html="loc.p_settings_mods_reload_desc2"></p>
                </span>
                <button class="fa ss_button btn_red bevel_red fullwidth" style="margin-bottom: 0 !important;" @click="refreshPage"><i class="fas fa-sync"></i> Reload Page</button>
            </div>
        </div>
        <div v-show="(!reloadNeeded && showModsTab) || (showSettingsTab && currentMod.noSettings)" class="roundme_md mod-msg info ss_margintop_lg ss_marginbottom_lg">
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
                <settings-adjuster :loc="loc" :loc-key="s?.locKey" :control-id="s.id" :control-value="s.value" :min="s.min" :max="s.max" :step="s.step" :multiplier="s.multiplier" :precision="s.precision" @setting-adjusted="onSettingAdjusted"></settings-adjuster>
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
            <h3 class="margin-bottom-none h-short" v-if="s?.locKey">{{ loc[s?.locKey ?? ''] || s?.locKey }}</h3>
            <div v-show="eval(s.showCondition)" v-html="s.html"></div>
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
                <div class="display-grid grid-column-2-eq">
                    <div v-for="s in settingsUi?.modSettings?.filter(s => !s.disabled && s.id !== 'megaMod') || []" class="f_col">
                        <div v-if="s.type === SettingType.Toggler">
                            <div class="nowrap" :class="s.showInfo ? 'has-settings' : ''">
                                <settings-toggler :loc="loc" :loc-key="s.locKey + '_title'" :control-id="s.id" :control-value="s.value" @setting-toggled="onSettingToggled"></settings-toggler>
                                <span v-if="s.showInfo" @click="showModSettings(s.id)">
                                    <i class="fas fa-cog modsettings-icon" @mouseenter="modSettingsHover"></i>
                                </span>
                            </div>
                        </div>
                    </div>
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

        const oldSettingsData = comp_settings.data();
        comp_settings.data = function() {
            return {
                ...oldSettingsData,
                showModsTab: false,
                showSettingsTab: false,
                reloadNeeded: false,
                currentMod: null,
                flashTimeouts: []
            };
        };
    
        const oldSettingsClick = comp_account_panel.methods.onSettingsClick;
        comp_account_panel.methods.onSettingsClick = function() {
            oldSettingsClick.call(this);
            if (vueApp.$refs.settings.showSettingsTab) {
                vueApp.$refs.settings.showSettingsTab = false;
                vueApp.$refs.settings.showModsTab = true;
            }
        }
    
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
                        if (modId === "themeManager") unsafeWindow.megaMod.customTheme.setThemeDesc(); // Eh this is a lazy solution but hey it works
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
                let storedSetting = (setting.type === SettingType.Slider) ? localStore.getNumItem(setting.id) : (setting.type === SettingType.Toggler) ? localStore.getBoolItem(setting.id) : localStore.getItem(setting.id);
                // Validate storedSetting
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
                    }
                }
                if (!ignoreSetting) {
                    if (storedSetting == null) localStore.setItem(setting.id, setting.value)
                    setting.storedVal = (storedSetting != null) ? storedSetting : setting.defaultVal;
                    setting.refreshReq = setting.refreshReq != null && setting.refreshReq;
                }
                Object.assign(setting, {
                    disabled: !setting.active || unsafeWindow.megaMod.regexErrs.includes(setting.id),
                    value: (storedSetting != null) ? storedSetting : setting.defaultVal,
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
                this.reloadNeeded = this.settingsUi.modSettings.some(isReloadNeeded);
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
                            this.onColorPickerChanged(setting.id, setting.defaultVal);
                            break;
                    }
                    //this.updateSettingTab();
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
                            localStore.setItem(setting.id, setting.value);
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
            }
        });

        // Chick'n Winner Popup Overlay Dismiss Disabled
        // TODO: Set the chwMiniGameComplete variable instead of overriding it
        const betterUIEnabled = `extern?.modSettingEnabled?.('betterUI_ui')`;
        const chwComplete = "$refs.chickenNugget.isMiniGameComplete";
        const cwInterval = setInterval(() => {
            const chicknWinner = document.getElementById("chicknWinner");
            if (!chicknWinner) return;
            clearInterval(cwInterval);
            chicknWinner.outerHTML = chicknWinner.outerHTML.replace(
                `:overlay-close="chwMiniGameComplete"`, 
                `:overlay-close="${betterUIEnabled} && ${chwComplete}"`
            ).replace(
                `:hide-close="!chwMiniGameComplete"`, 
                `:hide-close="${betterUIEnabled} && !${chwComplete}"`
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
            `<div v-show="isEquipModeInventory && ${invEditsEnabled}" class="roundme_lg clickme vaultbtn box_relative f_row align-items-center justify-content-center" :class="{ 'btn_red bevel_red': itemVaultEnabled, 'btn_blue bevel_blue': !itemVaultEnabled, 'disabled': !ui.showHomeEquipUi }" @click="onSwitchToVaultClicked">
                <i v-if="!itemVaultEnabled" class="fas fa-3x fa-lock text_white"></i>
                <i v-else class="fas fa-3x fa-arrow-left text_white"></i>
            </div> <div v-show="isEquipModeInventory`
        ).replace(
            `:disabled="extern.inGame"`,
            `:disabled="extern.inGame || (${invEditsEnabled} && itemVaultEnabled)"`
        ).replace(
            `<h3 v-if="!showPurchasesUi"`,
            `<h1 v-show="${invEditsEnabled} && isEquipModeInventory && itemVaultEnabled" class="equip-title text-center margins_sm box_relative text_blue5 nospace vault-txt" v-html="loc.megamod_betterUI_itemVault"></h1> <h3 v-if="!showPurchasesUi"`
        ).replace(
            `id="equip_panel_right"`,
            `id="equip_panel_right" :class="{ 'vaultopen' : (${invEditsEnabled} && isEquipModeInventory && itemVaultEnabled) }"`
        );
            
        // Item Vault: Hide Shop Button in Item Grid
        const itemGrid = document.getElementById("item-grid-template");
        itemGrid.innerHTML = itemGrid.innerHTML.replace("&& !isSearching", `&& !isSearching && (!${invEditsEnabled} || !itemVaultEnabled)`);

        Object.assign(vueData.equip, {
            showingItemTotal: 0,
            itemTotals: {}
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
                if (extern.modSettingEnabled("betterUI_inventory") && this.isEquipModeInventory && this.itemVaultEnabled) {
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
                    if (this.showShop && (this.isOnEquipModeFeatured || this.isOnEquipModeSkins)) this.selectFirstItemInShop();
                    else if (this.isEquipModeInventory) {
                        if (this.itemVaultEnabled) {
                            this.selectItem(this.equip.showingItems[0]);
                        } else {
                            this.selectEquippedItemForType();
                        }
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
                            selectSound = sounds[Math.floor(Math.random() * sounds.length)];
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
                    items = items.filter(i => i.is_available && !extern.isItemOwned(i) && (i.unlock === 'purchase' || (i.unlock === 'premium' && i.sku && i.activeProduct)));
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
                oldOnItemSelected.call(this, item);
            },
            onSwitchToVaultClicked() {
                this.itemVaultEnabled = !this.itemVaultEnabled;
                this.populateItemGrid(extern.getItemsOfType((this.equip.selectedItemType)));
                
                if (this.itemVaultEnabled) {
                    this.selectItem(this.equip.showingItems[0]);
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
                this.equip.itemTotals[featured] = extern.getTaggedItems(extern.specialItemsTag).filter(i => isShopItem(i) && i.is_available).length;

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
            }
        });
    
        // Add Item Icons & Price Commas
        const item = document.getElementById("item-template");
        item.innerHTML = item.innerHTML.replace(`<span v-if="isVipItem`,
            `<i v-if="${invEditsEnabled} && hasIcon" :class="iconClass" class="item-icon" @click.stop="iconClick" @mouseenter="iconHover"></i> 
            <span @click="iconClick" @mouseenter="iconHover" v-if="isVipItem`
        ).replace(`itemPrice`, 
            `typeof itemPrice === 'number' ? itemPrice.addSeparators() : itemPrice`
        ).replace(
            `<p v-if="showItemOnly"`,
            `<div v-show="extern?.modSettingEnabled?.('betterUI_inventory') && showLockIcon" class="centered"><i :class="lockIconClass" class="lock-icon"></i></div> <p v-if="showItemOnly"`
        );
    
        // Add Profile Image and Badges
        const profileScreen = document.getElementById("profile-screen-template");
        const badgesEnabled = `extern?.modSettingEnabled?.('betterUI_badges')`;
        const pfpEnabled = `extern?.modSettingEnabled?.('betterUI_pfp')`;
        profileScreen.innerHTML = profileScreen.innerHTML.replace(
            `center">\n\t\t\t\t\t<section>`,
            `center">
              <div id="player_photo" v-show="(${pfpEnabled}) && photoUrl && photoUrl !== '' && !isAnonymous">
                <img :src="photoUrl" class="roundme_md"/>
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
    
        Object.assign(comp_play_panel.methods, {
            showMapPopup() {
                BAWK.play("ui_popupopen");
                vueApp.$refs.mapPopup.show();
            },
            showGameHistoryPopup() {
                BAWK.play("ui_popupopen");
                vueApp.$refs.gameHistoryPopup.show();
            }
        });
    
        // Public Map & Game History Buttons
        const playPanel = document.getElementById("play-panel-template");
        playPanel.innerHTML = playPanel.innerHTML.replace(
            `ss-button-dropdown>`,
            `ss-button-dropdown><button v-show="extern?.modSettingEnabled?.('betterUI_ui')" @click="showMapPopup" class="map_btn ss_button btn_big btn_blue_light bevel_blue_light btn_play_w_friends display-grid align-items-center box_relative"><span v-html="loc.megaMod_betterUI_maps"></span></button>`
        ).replace(
            `<button @click="onJoinPrivateGameClick"`,
            `<button v-show="extern?.modSettingEnabled?.('betterUI_ui')" @click="showGameHistoryPopup" class="gameHistory_btn ss_button btn_big btn_blue bevel_blue btn_play_w_friends display-grid align-items-center box_relative"><span v-html="loc.megaMod_betterUI_gameHistory"></span></button><button @click="onJoinPrivateGameClick"`
        ).replace(`sort="order"></ss-button-dropdown>`,
            `sort="order"></ss-button-dropdown>
            <ss-button-dropdown v-show="extern?.modSettingEnabled?.('betterUI_ui')" class="play-panel-region-select btn-2 btn_serverselect" :loc="loc" :loc-txt="serverText" :selected-item="currentRegionId" @onListItemClick="onRegionPicked">
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
            </ss-button-dropdown> `
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

                if (!ignoreNotif && extern.modSettingEnabled('betterUI_badges')) {
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
            updateInfo: "",
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
                vueApp.$refs.gameHistoryPopup.close();
                BAWK.play("ui_popupopen");
                vueApp.showJoinPrivateGamePopup(code);
            },
            currencyCode: "USD",
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
            chwBarVisible: true
        });
    
        // Adjust size of stats container for badges
        const stats = document.getElementById("stats-stats-template");
        stats.innerHTML = stats.innerHTML.replace(
            `class="stats-container`,
            `:class="{ [statsClassName] : ${badgesEnabled}, 'stats-container-pfp' : ${pfpEnabled} }" class="stats-container`
        );
    
        STATSPOPUP.computed.statsClassName = function() {
            return `shorter-stats-container-${vueData.badges.rows.length}`;
        }
        
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
    
        const oldColorSelectData = comp_color_select.data();
        Object.assign(comp_color_select, {
            data() {
                return {
                    ...oldColorSelectData,
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
                    extern.setShellColor(Math.floor(Math.random() * ((this.isUpgrade) ? 14 : 7)));
                } else {
                    Object.assign(this, {
                        hueSliderVal: Math.floor(Math.random() * 101),
                        saturationSliderVal: Math.floor(Math.random() * 101),
                        brightnessSliderVal: Math.floor(Math.random() * 101)
                    });
                    this.updateColor(true);
                }
                BAWK.play('ui_onchange');
            }
        });
        
        // BUGGED!!!
        // Killstreak Info & First-Person Spec
        const ksInfoEnabled = `extern?.modSettingEnabled?.('killstreakInfo')`;
        const inFirstPerson = `!ui.game.spectatingPlayerName || game.isPaused`;
        const crosshairDot = `${inFirstPerson} && !extern?.modSettingEnabled?.('specTweaks_crosshair_dot')`;
        const crosshairMain = `${inFirstPerson} && !extern?.modSettingEnabled?.('specTweaks_crosshair_main')`;
        const updownKeybinds = `extern?.modSettingEnabled?.('specTweaks_updown')`;
        const gameScreen = document.getElementById("game-screen-template");
        gameScreen.innerHTML = gameScreen.innerHTML.replace(
            `uts">`,
            `uts">
             <h5 v-show="${ksInfoEnabled} && !game.isPaused" class="nospace title">TIME</h5>
             <p v-show="${ksInfoEnabled} && !game.isPaused" id="playTimer" class="name">0:00.000</p>`
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
            `<i v-show="extern?.modSettingEnabled?.('betterUI_chat')" class="fas6 fa-bullhorn hidden text_yellow ss_marginright_xs"></i><span class="text_yellow"`
        ).replace(
            `<small-popup id="playerActionsPopup"`,
            `<small-popup id="playerActionsPopup"`
        ).replace(
            `<div id="respawn-menu"`,
            `<div v-show="!isPoki && firebaseId && extern?.modSettingEnabled?.('betterUI_ui') && chwBarVisible" id="chw-progress-wrapper" class="chw-progress-wrapper box_relative">
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
                <img class="box_aboslute chw-eggs chw-progress-img" src="img/egg_pack_small.webp" alt="">
            </div><div id="respawn-menu"`
        );
        
        const oldGameScreenData = comp_game_screen.data();
        Object.assign(comp_game_screen, {
            data() {
                Object.assign(oldGameScreenData, {
                    upSpectateTxt: "",
                    downSpectateTxt: "",
                    spectateControlTxt: ""
                });
                return oldGameScreenData;
            },
            mounted() {
                this.updateSpectateControls();
            }
        });

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
    
                this.spectateControlTxt = controlTxt;
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
    
        const oldPhotoBoothData = CompPhotoboothUi.data();
        CompPhotoboothUi.data = function() {
            Object.assign(oldPhotoBoothData.egg, {
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
                ...oldPhotoBoothData,
                fps: 1,
                spinSpeed: 1
            };
        };
    
        Object.assign(CompPhotoboothUi.methods, {
            spinEgg(gif) {
                const time = this.egg.spinSpeeds[this.spinSpeed].time;
                const fps = this.egg.fpsAmounts[this.fps].fps;
                extern.spinEgg(time, Math.ceil(time * fps / 1000), gif && unsafeWindow.megaMod.photoboothEggSpin.captureFrame);
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
        const megaModChangelog = "changelog.megaModChangelog || false";
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
            "showHistoryChangelogPopup", "showHistoryChangelogPopup(changelog.megaModChangelog)"
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
    
        Object.assign(vueData.changelog, { megaModChangelog: false, showMegaModHistoryBtn: true });
        vueData.openMegaModInfo = () => {
            open('https://1nf1n1t3sm4sh3r.github.io/mmTest/');
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
        }
        
        // (Home Screen) Clock Icon Next To Challenge Timer, Challenge Info Button
        const chlgInfoIcon = `<i v-show="extern?.modSettingEnabled?.('betterUI_ui')" class="fas fa-info-circle info-btn" @click="showChallengeInfo()"></i>`;
        const mediaTabs = document.getElementById("media-tabs-template");
        mediaTabs.innerHTML = mediaTabs.innerHTML.replace(
            `<span v-show="challengeDailyData.days"`,
            `<i v-show="extern?.modSettingEnabled?.('betterUI_ui')" class="far fa-clock"></i><span <span v-show="challengeDailyData.days"`
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
            `><i v-show="extern?.modSettingEnabled?.('betterUI_ui')" class="far6 fa-egg-fried"></i> 
            {{ loc.home_desc_about }}
            <i v-show="extern?.modSettingEnabled?.('betterUI_ui')" class="fas6 fa-egg-fried"></i>`
        );

        const localizeNumber = (id, vals) => {
            const template = document.getElementById(id);
            vals.forEach(val => {
                template.innerHTML = template.innerHTML.replace(val, `(typeof ${val} === 'number' ? ${val.trim()}.addSeparators() : ${val})`);
            });
        }

        [
            { id: "account-panel-template", vals: ['eggBalance'] },
            { id: "the-stat-template", vals: ['statLifetime', 'statMonthly'] },
            { id: "stats-stats-template", vals: ['challengesClaimed.total', 'challengesClaimed.unique'] },
            { id: "player_challenge", vals: ['trueProgress', ' reward '] }, 
            { id: "equip-screen-template", vals: ['equip.buyingItem.price'] },
            { id: "price-tag-template", vals: ['item.price'] },
        ].forEach(x => localizeNumber(x.id, x.vals))

        const giveStuff = document.getElementById('give-stuff-popup');
        giveStuff.innerHTML = giveStuff.innerHTML.replace(`{{giveStuffPopup.eggs}}`, `{{ giveStuffPopup.eggs.addSeparators() }}`);

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
        }

        const oldSetupStat = StatTemplate.methods.setupStat;
        StatTemplate.methods.setupStat = function(stat) {
            if (stat?.length && !this.stat.kdr) stat = stat.map(s => typeof s === "number" ? s.addSeparators() : s);
			return oldSetupStat.call(this, stat);
		}

        const oldPlayAdText = CompChwHomeScreen.computed.playAdText;
        CompChwHomeScreen.computed.playAdText = function() {
            const oldTxt = oldPlayAdText.call(this);
            return this.chw.limitReached ? this.loc.chw_wake.format((200 * (this.chw.resets + 1)).addSeparators()) : oldTxt;
        }
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
            }
        });

         // Show Chick'n Winner Owned Item
        vueData.chw.reward.ownedItem = null;
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
        
        comp_chickn_winner_popup.methods.eggClass = function(count) {
            let hide;
            if (count > 5 && (this.reward.itemIds.length || (extern?.modSettingEnabled?.('betterUI_ui') && this.reward.ownedItem))) {
                hide = 'visibility-hidden cyborg-egg';
            }
            if (count > 5) {
                return `chick-alive ${hide} egg-${count} cyborg-egg`;
            }
        }

        const hasOwnedItem = "extern?.modSettingEnabled?.('betterUI_ui') && rewardHasOwnedItem";
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
    
                    <h3>{{ loc.megaMod_betterUI_gameHistoryPopup_list_title }} ({{ vueData?.gameHistory?${gameFilter}.length }})</h3>
                    <div class="table-div">
                        <table class="roundme_md sortable">
                            <thead>
                                <tr>
                                    <th v-for="key in ['map', 'megaMod_betterUI_gameHistoryPopup_column_mode', 'server', 'megaMod_betterUI_gameHistoryPopup_column_visibility', 'megaMod_betterUI_gameHistoryPopup_column_code']" v-html="loc[key]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="lobby in (vueData?.gameHistory || []).slice().reverse()${gameFilter}" @click="openGameCode(lobby.gameCode, lobby?.isOpen)">
                                    <td :data-sort="lobby.map.name" class="map-image"> 
                                        <div id="private_maps" class="roundme_md" :style="{ backgroundImage: \`url(/maps/\${lobby.map.filename}.png)\` }">
                                            <div id="mapNav">
                                                <h5 id="mapText" class="text-shadow-black-40">
                                                    {{ lobby.map.name }}
                                                    <span class="map_playercount text-shadow-black-40 font-nunito box_absolute">
                                                        <icon class="map-avg-size-icon fill-white shadow-filter" :name="getMapSizeIcon(maps.find(m => m.filename === lobby.map.filename).numPlayers)"></icon>
                                                    </span>
                                                </h5>
                                            </div>
                                        </div>
                                    </td>
                                    <td :data-sort="loc[lobby.modeLoc]">{{ loc[lobby.modeLoc] }}</td>
                                    <td :data-sort="loc[lobby.serverLoc]">{{ loc[lobby.serverLoc] }}</td>
                                    <td :data-sort="lobby.isPrivate ? 'Private' : 'Public'">
                                        {{ lobby.isPrivate ? 'Private' : 'Public' }}
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
                    <div class="changelog_content roundme_md">
                        <ul>
                            <li v-for="info in updateInfo" v-html="info">
                        </ul>
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

        // Add Popups
        const popupInterval = setInterval(() => {
            const gameDesc = document.getElementById('gameDescription');
            if (!gameDesc) return;
            clearInterval(popupInterval);
            gameDesc.insertAdjacentHTML('afterend', 
                `${badgeNotifPopup} ${badgePopup} ${challengePopup} ${mapPopup} ${gameHistoryPopup} ${errorPopups} ${updatePopups}`
            );
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
                src: `${rawPath}/img/assets/logos/megaMod-${Math.floor(Math.random()*5)}.png`,
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

        const regex = (strings, ...values) => new RegExp(
            strings.raw.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
            "g"
        );

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
            const [itemManagerInit, tempItemManagerInst] = regex`(${v})\=new\s${itemManagerClass}`.safeExec(src, "matchGrenades");
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
                            if (standardInstancedMesh) {
                                // cloneMesh for other grenades
                                src = src.safeReplace(cloneGrenadeMesh, `${standardInstancedMesh};${cloneGrenadeMesh};`, "matchGrenades");
                            }
    
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
                            src = src.safeReplace(`switchToGameUi(),`, `switchToGameUi(), extern.tryUpdateGrenades(),`, "matchGrenades");
                            src = src.safeReplace(`getMeshByName("grenadeItem"`, `getMeshByName(${itemManagerClass}.getCurrentGrenadeMesh()`, "matchGrenades");
    
                            // Calling checkCurrentGrenadeMesh() when updating loadout
                            src = src.safeReplace("generateLoadoutObject();", `generateLoadoutObject();if(extern.inGame){extern.tryUpdateGrenades();}`, "matchGrenades");
    
                            // Calling checkCurrentGrenadeMesh() during first-person spectate
                            let specMatches = Array.from(src.matchAll(regex`this\.spectatePlayer\(${v}\)`, "g"));
                            if (spectatingPlayer && specMatches.length) {
                                specMatches.forEach(([match]) => {
                                    src = src.safeReplace(match, `(${match}, extern.tryUpdateGrenades(${spectatingPlayer}.grenadeItem.item_data.meshName))`, "matchGrenades", true);
                                });
                            } else {
                                unsafeWindow.megaMod.addRegexErrId("matchGrenades");
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
                const [,pdMeshVar] = regex`dualAvatar\.${pdActorVar}\.(${v})\.scaling`.safeExec(src, "pbSpin");
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
                src = src.safeReplace(skyboxVarMatch, `${skyboxVarMatch}window.megaMod.setSkybox(${skyboxVar});`, "customSkybox")
                cubeTextureMatch = `window.megaMod.customSkybox.skybox.material${cubeTextureMatch}`;
                const customCubeTexture = cubeTextureMatch.safeReplace(skyboxInit, `extern.getSkybox()`, "customSkybox");
                const [,mapDataVar] = regex`(${v})\.skybox\|\|`.safeExec(src, "customSkybox");
                if (mapDataVar) {
                    cubeTextureMatch = cubeTextureMatch.safeReplace(`+${skyboxName}+`, `+${mapDataVar}.skybox+`, "customSkybox");
                    const [,skyboxModeVar] = regex`\.TEXTURE_SKYBOX_MODE\=([a-zA-Z0-9"][a-zA-Z0-9"]*)`.safeExec(src, "customSkybox");
                    if (fromHexStringFunc && skyboxModeVar) {
                        const skyboxFunc = `
                            updateSkybox: (enabled = false, hex="#ffffff") => {
                                const skybox = window.megaMod.customSkybox?.skybox;
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
                        src = src.safeReplace("crazySdk.showInviteButton", "(window.megaMod.customSkybox.usingSkyboxColor && window.megaMod.customSkybox.onSkyboxCategoryChanged('colors')),crazySdk.showInviteButton", "customSkybox");
                    }
                }
            }
        }
    
        // Spectate Speed
        src = src.safeReplace(".016*", `.016*extern.getSpecSpeed()*`, "specTweaks_speedSlider", true);
        src = src.safeReplace(".008*", `.008*extern.getSpecSpeed()*`, "specTweaks_speedSlider", true);
    
        // Color Slider Non-VIP Fix
        const [vipCheckMatch] = regex`\!${v}\.playerAccount\.isSubscriber`.safeExec(src, "colorSlider");
        if (vipCheckMatch) {
            src = src.safeReplace(vipCheckMatch, `${vipCheckMatch} && !extern?.usingSlider?.()`, "colorSlider");
        }
    
        // VIP Slider Color In-Game Init
        const [mePlayerInit, mePlayerVar, playerInst] = regex`\((${v})\=(${v})\)\.ws`.safeExec(src, "colorSlider");
        if (mePlayerInit && mePlayerVar) {
            const [,actorVar] = regex`${mePlayerVar}\.(${v})\.hit\(\)`.safeExec(src, "colorSlider");
            if (actorVar) {
                src = src.safeReplace(mePlayerInit, `(extern?.usingSlider?.() && vueApp.equip.colorIdx === 14 && ${playerInst}.${actorVar}.setShellColor(14)), ${mePlayerInit}`, "colorSlider");
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
        const [,teamColors] = regex`(${v})\.outline\[`.safeExec(src, ["hideHUD_nametags", "hideHUD_outlines", "betterUI_chatEvent_joinGame", "betterUI_chatEvent_leaveGame", "betterUI_chatEvent_switchTeam"]);
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
        if (hitMarkers) {
            src = src.safeReplace("catalog:", `switchHitMarkerColor: (enabled) => ${hitMarkers}.switchColor(enabled),catalog:`, "betterUI_hitMarkers");
        }
    
        // Longer Chat
        const [chatLengthMatch] = regex`\}${v}\.length\>4`.safeExec(src, "");
        if (chatLengthMatch) {
            src = src.safeReplace(chatLengthMatch, chatLengthMatch.replace(`>4`, `>(extern?.modSettingEnabled?.("betterUI_infChat") ? Number.MAX_SAFE_INTEGER : extern?.modSettingEnabled?.("betterUI_chat") ? 6 : 4)`));
        }
    
        // Chat Events
        const [,playerClickFunc, uniqueIdVar] = regex`onclick\=(${v})\(${v}\.(${v})\,${v}\,${v}\)`.safeExec(src, "");
        const [,playerSocialFunc] = regex`\=(${v})\(${v}\.social\)`.safeExec(src, "");
        if (teamColors && playerClickFunc && playerSocialFunc) {
            const chatEventFunc = `
                function addChatEvent (type, player) {
                    if (!Object.values(ChatEvent).includes(type) || !player || !extern?.modSettingEnabled?.(ChatEventData[type].setting)) return;
                    
                    const chatOut = document.getElementById("chatOut");
                    const notMePlayer = !player.ws;
                    
                    const chatItem = document.createElement("div");
                    chatItem.classList.add("chat-item", "chat-event", \`type-\${type}\`);
                    if (notMePlayer) chatItem.classList.add("clickme");
                    chatItem.style.fontStyle = "italic";
                    if (notMePlayer) {
                        const ISVIP = !player.hideBadge && player?.upgradeProductId > 0;
                        const GETSOCIALMEDIA = !player.hideBadge && ${playerSocialFunc}(player.social);
                        chatItem.onclick = ${playerClickFunc}(player.${uniqueIdVar}, GETSOCIALMEDIA, ISVIP);
                    }
                    
                    const nameDiv = document.createElement("div");
                    Object.assign(nameDiv.style, { display: "inline-block", color: ${teamColors}.text[player.team] });
                    
                    const eventIcon = document.createElement("i");
                    eventIcon.classList.add("fas", "fa-info-circle", "ss_marginright_xs");
                    
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

                    if (extern.modSettingEnabled("betterUI_infChat")) return;
                    const chatItems = Array.from(chatOut.querySelectorAll(".chat-item"));
                    chatItems.slice(0, Math.max(0, chatItems.length - 7)).forEach(item => item.remove());
                }
                let clientReady = false;
            `;
            src = src.safeReplace("window.BAWK", `${chatEventFunc}window.BAWK`, "");
        }
        if (src.includes("clientReady = false;")) {
            src = src.safeReplace(`vueApp.gameJoined`, `clientReady = false;vueApp.gameJoined`, "");
            src = src.safeReplace(`vueApp.delayInGamePlayButtons`, `clientReady = true;vueApp.delayInGamePlayButtons`, "");
            
            const [joinGameMatch, joinPlayerVar] = regex`(${v}).${v}\|\|\1\.${v}\.removeFromPlay\(\)`.safeExec(src, "");
            if (joinGameMatch && joinPlayerVar) {
                src = src.safeReplace(joinGameMatch, `if (clientReady) addChatEvent(ChatEvent.joinGame, ${joinPlayerVar});${joinGameMatch}`, "");
            }
        }
    
        const [leaveGameMatch, leavePlayerVar] = regex`\b(?!this\b)(${v})\.${v}\.remove\(\)`.safeExec(src, "");
        if (leaveGameMatch && leavePlayerVar) {
            src = src.safeReplace(leaveGameMatch, `${leaveGameMatch},addChatEvent(ChatEvent.leaveGame, ${leavePlayerVar})`, "");
        }
    
        const [switchTeamMatch, switchPlayerVar] = regex`(${v})\.stats\.kills\=0`.safeExec(src, "");
        if (switchTeamMatch && switchPlayerVar) {
            src = src.safeReplace(switchTeamMatch, `addChatEvent(ChatEvent.switchTeam, ${switchPlayerVar}),${switchTeamMatch}`, "");
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
        if (strDate && rawDate) {
            src = src.safeReplace(`._dateCreated=${strDate}`, `._dateCreated=${rawDate}`, "");
        }
        // Reconfigure playerAccount social (for badges)
        const [,socialVar] = regex`set\((${v})\)\s*\{[^{}]*this\._contentCreator\s*=\s*!0`.safeExec(src, "");
        if (socialVar) {
            src = src.safeReplace(`this._contentCreator=!0`, `this._contentCreator=${socialVar}`, "");
        }

        // Legacy Mode Inventory Icons
        const [,itemRendererVar] = regex`(${v})\.clearCanvas\(${v}\)`.safeExec(src, "legacyMode_skins");
        if (itemRendererVar) {
            const legacyIconFunction = `
                updateLegacyIcons: (enabled, meshName) => {
                    if (enabled) {
                        ${itemRendererVar}.meshRenderStaging[meshName + "_Legacy"] = ${itemRendererVar}.meshRenderStaging[meshName];
                    } else {
                        ${itemRendererVar}.meshRenderStaging[meshName.replace("_Legacy", "")] = ${itemRendererVar}.meshRenderStaging[meshName];
                    }
                }
            `;
            src = src.safeReplace("catalog:", `${legacyIconFunction},catalog:`, "legacyMode_skins");
        }

        // Fog Mode
        const [,fogScene, mapDataVar2] = regex`(${v})\.fogDensity\=(${v})\.fog\.density`.safeExec(src, "customFog");
        if (fogScene) {
            const [,fogModeVar] = regex`${fogScene}\.fogMode\=(${v}\.FOGMODE_EXP2)`.safeExec(src, "customFog");
            const [,defaultFogColor] = regex`${fogScene}\.fogColor\=(new\s${v}\(\s*\d*\.?\d+\s*,\s*\d*\.?\d+\s*,\s*\d*\.?\d+\s*,\s*\d*\.?\d+\s*\))`.safeExec(src, "customFog");
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
                    window.megaMod.constructor.log("extern.updateFog() -", \`Enabled: \${enabled}\ | Density: \${${fogScene}.fogDensity} | Color: \${${fogScene}.fogColor}\`);
                }
                `;
                src = src.safeReplace("catalog:", `${fogColorFunc},catalog:`, "customFog");
            }
        }
        if (mapDataVar2) {
            const [mapInit] = regex`${mapDataVar2}\.extents\.x\.min\=0`.safeExec(src, "customFog");
            if (mapInit) {
                src = src.safeReplace(mapInit, `${mapInit},window.megaMod.customFog.initFog(${mapDataVar2}.fog)`, "customFog");
            }
        }
        
        // All done...yay! :)
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
		const origSetting = this.extractSettings(vueApp.$refs.settings.originalSettings.modSettings).find(m => m.id === id);
		if (origSetting) origSetting.value = value;
		localStore.setItem(id, value);
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
				if (extern.inGame) extern.tryUpdateGrenades();
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
			case 'betterUI_pfp':
			case 'betterUI_badges':
				this.betterUI.refreshProfileScreen();
				break;
			case 'betterUI_roundness':
				this.betterUI.switchRoundness(settingEnabled);
				break
			case 'betterUI_colors':
				this.betterUI.switchColored(settingEnabled);
				break;
			case 'betterUI_hitMarkers':
				if (extern.inGame) extern.switchHitMarkerColor(settingEnabled);
				break;
			case 'betterUI_chat':
				this.betterUI.switchChatUpgrades(settingEnabled);
				break;
			case 'specTweaks':
			case 'specTweaks_updown':
				vueApp.$refs.gameScreen.updateSpectateControls();
				break;
			case 'themeManager':
				document.getElementById(`themeCSS-${this.getModSettingById("themeManager_themeSelect").value}`).disabled = !value;
				break;
			case 'customSkybox':
				extern.updateSkybox(
                    value, 
                    this.getModSettingById('customSkybox_colorPicker').value
                );
				break;
            case 'customFog':
                extern.updateFog(
                    value, 
                    this.getModSettingById('customFog_densitySlider').value / 100, 
                    this.getModSettingById('customFog_colorPicker').value
                );
                break;
            case "betterUI_infChat":
                if (!settingEnabled) this.betterUI.adjustChatLength();
                break;
		}
		if (id.includes("hideHUD_")) this.hideHUD.disableHideHUD();
		if (id.includes("legacyMode_sfx_")) this.legacyMode.switchLegacySounds(this.modSettingEnabled("legacyMode"));
		if (id.includes("betterUI_chatEvent_")) {
			const type = Object.keys(ChatEventData).find(k => ChatEventData[k].setting === id);
			this.betterUI.switchChatEvent(type, settingEnabled);
		}
		vueApp.$refs.settings.checkReloadNeeded();
	}

	newAdjusterFunc(id, value) {
		if (this.isModSetting(id)) this.updateModSetting(id, parseInt(value));
		switch (id) {
			case "changeFPS_slider":
				this.changeFPS.setFPS(value);
				break;
            case "customFog_densitySlider":
                extern.updateFog(
                    this.modSettingEnabled("customFog"),
                    value / 100, 
                    this.getModSettingById('customFog_colorPicker').value, 
                );
                break;
		}
	}

	newKeybindFunc(id, value) {
		if (this.isModSetting(id)) this.updateModSetting(id, value.toUpperCase());
		switch (id) {
			case "ascend":
			case "descend":
			case "toggle_freecam":
			case "hideHUD_keybind":
			case "specTweaks_freezeKeybind":
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
				extern.updateSkybox(settingEnabled);
				break;
		}
	}

    newColorPickerFunc(id, value) {
        if (this.isModSetting(id)) this.updateModSetting(id, value);
        const settingEnabled = this.modSettingEnabled(id);
		switch (id) {
            case 'customSkybox_colorPicker':
                extern.updateSkybox(settingEnabled, value);
                break;
			case 'customFog_colorPicker':
				extern.updateFog(
                    settingEnabled,
                    this.getModSettingById('customFog_densitySlider').value / 100, 
                    value, 
                );
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
                this.updateSettingTab();
            }
        });
    }

    addKeydownEL() {
        MegaMod.log("addKeydownEL() -", "Adding keydown EventListener");

        const hideHUDErr = ["hideHUD", "hideHUD_keybind"].some(settingId => this.modErrs.includes(settingId));
        const freezeErr = ["specTweaks", "specTweaks_freezeKeybind"].some(settingId => this.modErrs.includes(settingId));
        //const ksInfoErr = this.modErrs.includes("killstreakInfo") || this.modErrs.includes("killstreakInfo_keybind");
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
            //const ksKey = this.getModSettingById("killstreakInfo_keybind")?.value.toLowerCase();
            switch (e.key.toLowerCase()) {
                case hideKey:
                    if (!hideHUDErr && extern.modSettingEnabled("hideHUD")) this.hideHUD.toggleHideHUD();
                    break;
                /*
                case ksKey:
                    // TODO: toggle KSInfo Popup
                    if (this.modErrs.includes("killstreakInfo") || this.modErrs.includes("killstreakInfo_keybind") || !extern.modSettingEnabled("killstreakInfo")) break;
                    break;
                */
                case freezeKey:
                    if (!freezeErr && extern.modSettingEnabled("specTweaks") && vueApp.ui.game.spectate) this.spectateTweaks.toggleFreezeFrame();
                    break;
            }
        });
    }

    modSettingEnabled(id, ignoreParent) {
        const setting = this.getModSettingById(id);
        const parent = this.getModSettingById(setting?.parentId);
        return !this.modErrs.includes(id) 
            && (setting?.value ?? false) && (!setting?.disabled ?? false) 
            && (ignoreParent || (parent?.value ?? true) && (!parent?.disabled ?? true));
    }

    addExternFuncs() {
        MegaMod.log("addExternFuncs() -", "Adding extern functions");

        Object.assign(extern, {
            modSettingEnabled: this.modSettingEnabled.bind(this),
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

        MegaMod.fetchJSON('/data/changelog.json').then(data => vueData.changelog.megaMod = data);
        Object.assign(vueApp, {
            showChangelogPopup(megaMod = false) {
                this.changelog.megaModChangelog = megaMod;
                this.$refs.changelogPopup.show();
            },
            showMegaModTab(changelog = false) {
                if (changelog) vueApp.hideChangelogPopup();
                vueApp.showSettingsPopup();
                vueApp.$refs.settings.switchTab('mod_button');
            },
            showHistoryChangelogPopup(megaMod = false) {
                const processChangelog = (logs, target) => {
                    logs.forEach(log => {
                        const content = this.changelogSetup(log);
                        log.content.length = 0;
                        log.content.push(...content);
                        target.push(log);
                    });
                };
                
                if (megaMod) {
                    processChangelog(this.changelog.megaMod.old, this.changelog.megaMod.current);
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

    setSkybox(skybox) {
        if (this.customSkybox) this.customSkybox.setSkybox(skybox);
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
            { id: "customFog",      constructor: CustomFog }
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
        if (timerEnabled) this.modConflicts.push("killstreakInfo");

        this.modErrs = this.regexErrs.concat(this.modConflicts);

        this.extractSettings(vueApp.settingsUi.modSettings).forEach(setting => {
            const errorKey = `${setting.id}_isError`;
            const settingError = this.modErrs.includes(setting.id);
            if (settingError) {
                setting.active = false;
                if (setting.type === SettingType.Toggler) setting.value = setting.safeVal || false;
            } else if (localStore.getBoolItem(errorKey)) {
                if (setting.type === SettingType.Toggler) setting.value = setting.defaultVal;
            }
            localStore.setItem(errorKey, settingError);
        });
    }

    checkForUpdate(updateInfo) {
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
                            vueData.updateInfo = updateInfo;
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

    showModErrorPopup() {
        MegaMod.log("showModErrorPopup() -", "Checking whether to show Mod Error popups");

        const getModNames = (arr) => {
            const getModName = (id) => {
                const getTitleLocKey = (arr, id) => {
                    for (const obj of arr) {
                        if (obj.id === id) return obj.locKey;
                        if (obj.settings) {
                            const result = getTitleLocKey(obj.settings, id);
                            if (result) return `${obj.locKey || result}_title`;
                        }
                    }
                    return null;
                }
                const setting = this.getModSettingById(id);
                if (!setting) return id;
                return vueData.loc[(setting.settings) ? `${setting.locKey}_title` : getTitleLocKey(vueApp.settingsUi.modSettings, id)];
            };

            return [...new Set(arr.map(id => getModName(id)))];
        };
        
        if (this.regexErrs.length) {
            vueData.modErrsPopupContent = vueData.loc['megaMod_modErrsPopup_desc'].format(getModNames(this.regexErrs).join("<br>"));
            vueApp.$refs.modErrsPopup.show();
        }
        if (this.modConflicts.length) {
            vueData.disableModsPopupContent = vueData.loc['megaMod_disableModsPopup_desc'].format(getModNames(this.modConflicts).join("<br>"));
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
            this.checkForUpdate(data.updateInfo);
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
        this.addSettingsHooks();
        MegaMod.fetchJSON('/mods/data/themes.json').then(data => {
            if (!this.modErrs.includes("themeManager")) this.customTheme = new CustomTheme(data);
        });
        vueApp.$refs.settings.initModSettings();
        const externInterval = setInterval(() => {
            if (!extern?.specialItemsTag) return;
            clearInterval(externInterval);
            this.addExternFuncs();
            this.addAllModFunctions();
            this.showModErrorPopup();
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
                    case "premium":
                    case "vip":
                    case "bundle":
                    case "physical":
                    case "manual":
                    case "default":
                    case "purchase":
                        // Nice and ez checks, W devs.
                        return item.unlock === theme;
                    case "eggpremium":
                        return this.isThemedItem(item, "purchase") && (item?.item_data?.tags?.some(t => t.toLowerCase() === 'premium') ?? false);
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
                    case "creatoryoutube":
                        return item?.item_data?.tags?.includes(unsafeWindow.megaMod.betterUI.tags.creator.format(unsafeWindow.megaMod.betterUI.creatorTypes[4])) ?? false;
                    case "creatortwitch":
                        return item?.item_data?.tags?.includes(unsafeWindow.megaMod.betterUI.tags.creator.format(unsafeWindow.megaMod.betterUI.creatorTypes[6])) ?? false;
                    case "shop":
                        return this.isThemedItem(item, "purchase") && ["creator", "limited", "event"].every(theme => !this.isThemedItem(item, theme));
                }
            },
            getThemedItems(theme) {
                return [
                    ...this.catalog.hats, 
                    ...this.catalog.stamps, 
                    ...this.catalog.grenades, 
                    ...this.catalog.primaryWeapons, 
                    ...this.catalog.secondaryWeapons, 
                    ...this.catalog.melee
                ].filter(item => !theme || this.isThemedItem(item, theme));
            },
            tryEquipItem(item, type) {
                if (!vueApp.itemVaultEnabled || (item && this.isItemOwned(item))) oldTryEquipItem.call(this, item, type);
            },
        })
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
                        MegaMod.error("Better UI", `Check "${tag}" Item Tag for ${item.name}`);
                        return;
                    }
                    if (!item.item_data.tags) item.item_data.tags = [];
                    if (add) item.item_data.tags.push(tag);
                    else item.item_data.tags.splice(item.item_data.tags.indexOf(tag), 1);
                });
            };

            // Add or Remove Missing/Wrong Item Tags
            this.tagEdits.forEach(edit => addTags(edit.add, extern.catalog.findItemById(edit.id), edit.tags));

            const isThemed = (item) => ["drops", "notif", "yolker", "promo", "event", "creator", "shop"].some(theme => extern.isThemedItem(item, theme));

            // Set Bundle Unlock Type
            extern.getTaggedItems(this.tags.bundle).forEach(item => {
                if (!item.origUnlock) item.origUnlock = item.unlock;
                item.unlock = extern.modSettingEnabled("betterUI_inventory") && !isThemed(item) ? "bundle" : item.origUnlock;
            });

            extern.catalog.findItemsByIds(extern.getActiveBundles().flatMap(bundle => bundle.itemIds)).filter(item => !(["default", "premium"].includes(item.unlock) || isThemed(item))).forEach(item => addTags(true, item, this.tags.bundle));

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
            const themes = [
                "bundle", "physical", "drops", "notif", "league", "yolker", "egglite",
                "creatortwitch", "creatoryoutube", "promo", "event", "social",
                "creator", "shop", "legacy", "eggpremium"
            ];
            this.themeMap = Object.fromEntries(themes.map(theme => [theme, extern.isThemedItem(this.item, theme)]));
        }
        Object.assign(comp_item.computed, {
            isBundle() { return this.themeMap.bundle; },
            isMerch() { return this.themeMap.physical; },
            isDrops() { return this.themeMap.drops; },
            isNotif() { return this.themeMap.notif; },
            isLeague() { return this.themeMap.league; },
            isNewYolker() { return this.themeMap.yolker; },
            isEgglite() { return this.themeMap.egglite; },
            isTwitchCreator() { return this.themeMap.creatortwitch; },
            isYTCreator() { return this.themeMap.creatoryoutube; },
            isPromo() { return this.themeMap.promo; },
            isEvent() { return this.themeMap.event; },
            isSocial() { return this.themeMap.social; },
            isCreator() { return this.themeMap.creator; },
            isNormalShop() { return this.themeMap.shop; },
            isLegacy() { return this.themeMap.legacy; },
            isPremiumEggPurchase() { return this.themeMap.eggpremium; },
        
            // Banner check
            hasBanner() {
                const themedItems = [
                    this.isLimited, this.isBundle, this.isMerch, this.isDrops, 
                    this.isNotif, this.isLeague, this.isNewYolker, this.isEgglite, 
                    this.isPromo, this.isEvent, this.isSocial, this.isCreator, 
                    this.isLegacy
                ];
                return this.isPremium || this.isVipItem || this.isPremiumEggPurchase ||
                    (extern.modSettingEnabled("betterUI_inventory") && themedItems.some(Boolean));
            },
        
            // Banner Text
            bannerTxt() {
                if (!this.hasBanner) return;

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
                const invEditsEnabled = extern.modSettingEnabled("betterUI_inventory");
                return {
                    'highlight': this.isSelected,
                    'is-bundle': this.isBundle,
                    'is-premium': this.isPremium || this.isPremiumEggPurchase,
                    'is-vip': this.isVipItem,
                    'is-merch': invEditsEnabled && this.isMerch,
                    'is-drops': invEditsEnabled && this.isDrops,
                    'is-ny': invEditsEnabled && this.isNewYolker,
                    'is-notif': invEditsEnabled && this.isNotif,
                    'is-league': invEditsEnabled && this.isLeague,
                    'is-egglite': invEditsEnabled && this.isEgglite,
                    'is-promo': invEditsEnabled && this.isPromo,
                    'is-event': invEditsEnabled && this.isEvent,
                    'is-social': invEditsEnabled && this.isSocial,
                    'is-creator-yt': invEditsEnabled && this.isYTCreator,
                    'is-creator-twitch': invEditsEnabled && this.isTwitchCreator,
                    'is-shop': invEditsEnabled && this.isNormalShop,
                    'is-legacy': invEditsEnabled && this.isLegacy,
                    'is-locked': invEditsEnabled && this.showLockIcon,
                    'customtheme': invEditsEnabled && [
                        this.isBundle, this.isMerch, this.isDrops, this.isNewYolker, this.isNotif,
                        this.isLeague, this.isEgglite, this.isPromo, this.isEvent,
                        this.isSocial, this.isCreator, this.isLegacy
                    ].some(Boolean)
                };
            },
        
            // Tooltips
            tooltip() {
                if (!(this.showTooltip && extern.modSettingEnabled("betterUI_inventory"))) return "tool-tip";
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
                    ['isTwitchCreator', 'twitchcc'],
                    ['isLegacy', 'legacy']
                ];
                const tooltipStyle = tooltipStyleMap.find(([themeProp]) => this[themeProp])?.[1];
                return "tool-tip" + (tooltipStyle ? " " + tooltipStyle : "") + (this.showLockIcon ? " locked" : "");
            },
        
            // Icon Check
            hasIcon() {
                return this.isBundle || vueApp.currentEquipMode === vueApp.equipMode.inventory && (
                    this.isPremium || this.isPremiumEggPurchase || this.isLeague || this.isEgglite ||
                    this.isLimited || this.isDrops || this.isNotif || this.isMerch || 
                    this.isCreator || this.isNewYolker || this.isPromo || 
                    this.isEvent || this.isSocial || this.isLegacy /*|| this.isNormalShop*/
                );
            },

            // Premium Icon
            premiumIcon() {
                return unsafeWindow.megaMod.betterUI.currencyIcons[vueApp.currencyCode];
            },
        
            // Icon CSS Class
            iconClass() {
                if (!this.hasIcon) return;
                return this.isBundle ? 'fas fa-box-open hover' :
                    this.isPremium ? this.premiumIcon + ' hover' :
                    this.isMerch ? 'fas fa-tshirt hover' :
                    this.isDrops ? 'fab fa-twitch hover' :
                    this.isNotif ? 'fas fa-bell hover' :
                    this.isLeague ? 'fas fa-trophy' :
                    this.isNewYolker ? 'fas fa-envelope-open-text hover' :
                    this.isEgglite ? 'fas6 fa-sparkles' :
                    this.isYTCreator ? 'fab fa-youtube hover' :
                    this.isTwitchCreator ? 'fab fa-twitch hover' :
                    this.isLimited ? 'far fa-gem hover' :
                    this.isSocial ? 'fas fa-share hover' :
                    this.isPromo ? 'fas fa-ad hover' :
                    this.isEvent ? 'fas fa-calendar-alt' :
                    (this.isNormalShop || this.isPremiumEggPurchase) ? 'fas fa-egg' :
                    this.isLegacy ? 'fas6 fa-history' : '';
            },
        
            // Icon Hover
            iconHover() {
                return (this.isVipItem || this.iconClass.includes("hover")) ? () => { /*BAWK.play("ui_chicken");*/ } : () => {};
            },
        
            // Icon Click
            iconClick() {
                const addClickSFX = (fn) => () => { BAWK.play("ui_equip"); fn(); };
                if (this.isPremium || this.isBundle) return () => vueApp.openEquipSwitchTo(vueApp.equipMode.shop);
                if (this.isPremiumEggPurchase) return () => vueApp.openEquipSwitchTo(vueApp.equipMode.skins);
                if (this.isMerch) return addClickSFX(() => open('https://bluewizard.threadless.com/'));
                if (this.isVipItem) return vueApp.showSubStorePopup;
                if (this.isDrops) return addClickSFX(() => open((dynamicContentPrefix || '') + 'twitch'));
                if (this.isNotif) return addClickSFX(() => Notification.requestPermission());
                if (this.isNewYolker) return addClickSFX(() => open('https://bluewizard.com/subscribe-to-the-new-yolker/'));
                if (this.item.creatorUrl && this.isCreator) return addClickSFX(() => open(`https://${this.item.creatorUrl}`));
                if (this.item.promoUrl && this.isPromo) return addClickSFX(() => open(`https://${this.item.promoUrl}`));
                if (this.isSocial) return addClickSFX(() => open(vueApp.ui.socialMedia.footer.find(social => social.id === this.item.id).url));
                if (this.isLimited) return () => {
                    vueApp.openEquipSwitchTo(vueApp.equipMode.featured);
                    vueApp.equip.showingItems = extern.getTaggedItems(extern.specialItemsTag).filter(item => item.is_available && extern.isItemOwned(item));
                };
                return () => {};
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
            // Better Inventory - Modify Item Sorting (Order)
            // Premium --> VIP --> Bundle --> Merch --> Drops --> Yolker --> League --> Notif --> Egglite --> Promo --> Event --> Social --> Default/Legacy --> Limited --> Creator --> Shop
            itemsSorted() {
                const itemThemeMap = {};
                const isThemed = (item, theme) => {
                    itemThemeMap[item.id] ??= {};
                    itemThemeMap[item.id][theme] ??= extern.isThemedItem(item, theme);
                    return itemThemeMap[item.id][theme];
                };
                const compareThemedItem = (a, b, theme) => isThemed(a, theme) - isThemed(b, theme);
                
                const invEditsEnabled = extern.modSettingEnabled("betterUI_inventory");
                return this.items.sort((b, a) => {
                    for (const theme of unsafeWindow.megaMod.betterUI.themeOrder) {
                        const result = compareThemedItem(a, b, theme.theme) * (!theme.custom || invEditsEnabled);
                        if (result !== 0) return result;
                    }
                    return 0;
                });
            },
            emptyGridMsg() {
                if (extern.modSettingEnabled("betterUI_inventory") && this.itemVaultEnabled) {
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
            if (extern.modSettingEnabled("betterUI_ui")) BAWK.play("challenge_notify");
        }

        // Notify Popup Claim SFX
        const oldNextItem = NotifiSlider.methods.nextItem;
        NotifiSlider.methods.nextItem = function(...args) {
            oldNextItem.apply(this, args);
            if (extern.modSettingEnabled("betterUI_ui") && this.isChallenge) BAWK.play("challenge_notify");
        }

        // Fixed Weapon Deselect Bug
        const oldSelectItem = vueApp.$refs.equipScreen.selectItem;
        Object.assign(vueApp.$refs.equipScreen, {
            selectItem(item) {
                const invEnabled = extern.modSettingEnabled("betterUI_inventory");
                const selectingSame = hasValue(this.equip.selectedItem) && this.equip.selectedItem.id === item.id;
                const isWeapon = ![ItemType.Hat, ItemType.Stamp].includes(item?.item_type_id);
                if (invEnabled && this.itemVaultEnabled && item.item_type_id === ItemType.Stamp && this.$refs.stampCanvas) extern.renderItemToCanvas(item, this.$refs.stampCanvas);
                if (invEnabled && selectingSame && isWeapon) {
                    this.selectItemClickSound(item);
                    return;
                }
                oldSelectItem.call(this, item);
            },
            renderStamp() {
                if (this.$refs.stampCanvas === undefined) return;
    
                let item = this.equip.selectedItem;
                if (!this.isEquipModeInventory) {
                    item = this.equipped[ItemType.Stamp]
                }
    
                // Fixing BWD's buggy code errors...smh
                if (!item) return;
                extern.renderItemToCanvas(item, this.$refs.stampCanvas);
            },
        });

        const addStyle = (name) => {
            const preload = extern.modSettingEnabled("megaMod_cssPreload");
            const url = `/mods/css/${name}.css`;
            const style = document.createElement(preload ? 'style' : 'link');
            document.body.appendChild(style);
            if (preload) {
                MegaMod.fetchCSS(url).then(css => style.textContent = css);
            } else {
                Object.assign(style, { rel: 'stylesheet', href: (cdnPath + url) });
            }
            return style;
        };
        // Add CSS
        Promise.all([
            addStyle('ui'),
            addStyle('inventory'),
            addStyle('roundness'),
            addStyle('colors'),
            addStyle('chat')
        ]).then(styles => {
            const [UITweaksStyle, betterInvStyle, roundnessStyle, coloredStyle, chatUpgradeStyle] = styles;
            Object.assign(this, { UITweaksStyle, betterInvStyle, roundnessStyle, coloredStyle, chatUpgradeStyle });
            setTimeout(this.switchBetterUI.bind(this), 250, true);
        });

        // Init Profile Badges
        MegaMod.fetchJSON('/mods/data/badges.json').then(data => this.initProfileBadges(data));

        // Fresh Player Badge Alert
        const oldOnTutorialPopupClick = vueApp.onTutorialPopupClick;
        vueApp.onTutorialPopupClick = function(...args) {
            oldOnTutorialPopupClick.apply(this, args);
            if (!extern.modSettingEnabled('betterUI_badges')) return;
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

        const oldProgBarReset = vueApp.progressBarReset;
        vueApp.progressBarReset = function() {
            oldProgBarReset.call(this);
            MegaMod.createFocusTimer(100, 1500, function() {
                if(extern.inGame) megaMod.betterUI.addGameToHistory();
            });
        }

        // Chat Auto Scroll
        const chatOut = document.getElementById('chatOut');
        const scrollChat = () => chatOut.scrollTop = chatOut.scrollHeight;
        const observer = new MutationObserver(() => {
            if (extern.modSettingEnabled("betterUI_infChat")) scrollChat();
        });
        observer.observe(chatOut, { childList: true });

        const oldRespawn = extern.respawn;
        extern.respawn = () => {
            oldRespawn.call(this);
            if (extern.modSettingEnabled("betterUI_infChat")) scrollChat();
        };

        const oldPlayIncentivizedAd = vueApp.playIncentivizedAd;
        vueApp.playIncentivizedAd = function() {
            if (extern.modSettingEnabled("betterUI_ui") && this.chw.limitReached && extern.inGame && !this.chw.ready) {
                BAWK.play("ui_playconfirm");
                this.chwBarVisible = false;
                const barInterval = setInterval(((chq) => {
                    if (this.chw.limitReached && !this.chw.ready) return;
                    clearInterval(barInterval);
                    this.chwBarVisible = true;
                }).bind(this), 200);
            }
            oldPlayIncentivizedAd.call(this, e);
        }
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
        const gameCode = vueApp.game.shareLinkPopup.url.split("#")[1].toUpperCase();;
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
        setTimeout(this.checkOpenGames.bind(this), 1000);
    }

    saveGameHistory() {
        localStore.setItem(BetterUI.GAME_HISTORY_KEYS.list, JSON.stringify(vueApp.gameHistory));
    }

    setGameClosed(id) {
        vueApp.gameHistory[vueApp.gameHistory.findIndex(game => game.gameCode === id)].isOpen = false;
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
                const { command, error } = JSON.parse(e.data);
                if (this.noticeReceived && error === "gameNotFound") {
                    unsafeWindow.megaMod.betterUI.setGameClosed(id.toUpperCase());
                }
                this.noticeReceived = command === "notice";
            }
        });
    }

    checkOpenGames() {
        MegaMod.log("checkOpenGames() -", "Checking Open Games...");
        this.checkGameHistory();
        vueApp.gameHistory.filter(game => game?.isOpen).forEach(({ gameCode }) => this.checkGame(gameCode.toLowerCase()));
        
        if (this.gameHistoryTimeout) clearTimeout(this.gameHistoryTimeout);
        this.gameHistoryTimeout = setTimeout(this.checkOpenGames.bind(this), 5*60000);
    }

    initProfileBadges(badgeData) {
        MegaMod.log("Better UI:", "Initializing Profile Badges");

        this.badgeData = badgeData;
        const {
            switchToProfileUi : oldSwitchToProfileUi,
            statsLoading: oldStatsLoading,
            switchToHomeUi: oldSwitchToHomeUi
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
                        } else 
                            badgeMap.set(mapKey, newBadge);
                        
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
                    if (badge.tierValues) 
                        badge.tierValues.forEach((value, i) => setupBadge({ ...badge, value }, i));
                    else 
                        setupBadge(badge);
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
            }
        });

        const playerAccount = extern.account.constructor;
        const { 
            signedIn: oldSignedIn, 
            loggedOut: oldLoggedOut, 
            scoreKill: oldScoreKill, 
            die: oldDie,
            addToInventory: oldAddToInventory 
        } = playerAccount.prototype;
        Object.assign(playerAccount.prototype, {
            signedIn(...args) {
                oldSignedIn.apply(this, args);
                setTimeout(vueApp.updateBadges.bind(vueApp), 1000);
                vueApp.photoUrl = extern.firebaseUrl;
            },
            loggedOut(...args) {
                oldLoggedOut.apply(this, args);
                this.challengesClaimed = [];
                vueApp.updateBadges(true);
            },
            scoreKill(...args) {
                oldScoreKill.apply(this, args);
                vueApp.updateBadges();
            },
            die(...args) {
                oldDie.apply(this, args);
                vueApp.updateBadges();
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
            randomItems[type] = typeItems[Math.floor(Math.random() * typeItems.length)];
        });

        vueData.equip.selectedItem = randomItems[vueApp.equip.selectedItemType];
        Object.values(randomItems).filter(item => item != null).forEach(item => extern.tryEquipItem(item));
        extern.poseWithItems(randomItems);
        //extern.setShellColor(Math.floor(Math.random() * (extern.account.isUpgraded() ? 14 : 7)));
        vueApp.$refs.equipScreen.updateEquippedItems();
        vueApp.$refs.equipScreen.moveStamp(
            Math.floor(Math.random() * 25) - 12, // -12 to 12 inclusive
            Math.floor(Math.random() * 33) - 15 // -15 to 17 inclusive
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

    switchBetterInv(enabled, init) {
        // Set Bundle Unlock Type
        extern.getTaggedItems(this.tags.bundle).forEach(item => {
            if (!item.origUnlock) item.origUnlock = item.unlock;
            item.unlock = enabled ? "bundle" : item.origUnlock;
        });

        // Add/Remove "Limited" tag to Monthly Featured Items
        extern.getTaggedItems(extern.specialItemsTag).filter(item => item.is_available && !["premium", "bundle"].includes(item.unlock)).forEach(item => {
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

    adjustChatLength() {
        if (extern.modSettingEnabled("betterUI_infChat")) return;
        const chatItems = Array.from(document.getElementById("chatOut").querySelectorAll(".chat-item"));
        const maxLength = extern.modSettingEnabled?.("betterUI_chat") ? 7 : 5;
        chatItems.slice(0, Math.max(0, chatItems.length - maxLength)).forEach(item => item.remove());
    }

    switchChatUpgrades(enabled) {
        this.chatUpgradeStyle.disabled = !enabled;
        if (!enabled) this.adjustChatLength();
        Object.entries(ChatEventData).forEach(([type, v]) => this.switchChatEvent(type, extern.modSettingEnabled(v.setting)));
    }

    switchChatEvent(type, enabled) {
        const chatItems = Array.from(document.getElementById("chatOut").querySelectorAll(`.chat-item.type-${type}`));
        chatItems.forEach(item => item.style.setProperty("display", enabled ? "" : "none", 'important'));
        this.adjustChatLength();
    }

    switchBetterUI(init) {
        if (extern.inGame) extern.switchHitMarkerColor(extern.modSettingEnabled("betterUI_hitMarkers"));
        this.switchUITweaks(extern.modSettingEnabled("betterUI_ui"));
        this.switchBetterInv(extern.modSettingEnabled("betterUI_inventory"), init);
        this.refreshProfileScreen();
        unsafeWindow.megaMod.colorSlider.refreshColorSelect();
        this.switchRoundness(extern.modSettingEnabled("betterUI_roundness"));
        this.switchColored(extern.modSettingEnabled("betterUI_colors"));
        this.switchChatUpgrades(extern.modSettingEnabled("betterUI_chat"));
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
        }
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
                if (extern.modSettingEnabled("legacyMode")) this.switchLegacySounds(extern.modSettingEnabled("legacyMode_sfx"));
            });
        }, 250);
        
        // TODO: Fix This (bugs on startup when defaults are equipped)
        const skinsInterval = setInterval(() => {
            if (extern.account && extern.account.colorIdx == null) return;
            clearInterval(skinsInterval);
            vueApp.$refs.equipScreen.equipped = extern.account.getEquippedItems();
            if (extern.modSettingEnabled("legacyMode")) this.switchLegacySkins(extern.modSettingEnabled("legacyMode_skins"));
        }, 250);
    }

    getAllLegacySounds(obj = this.legacySounds) {
        const values = [];
        for (const key in obj) {
            if (Array.isArray(obj[key])) values.push(...obj[key]);
            else if (typeof obj[key] === 'object') values.push(...this.getAllLegacySounds(obj[key]));
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
            extern.updateLegacyIcons(enabled, meshName)
            if (enabled) {
                item.item_data.meshName += (!meshName.includes("_Legacy")) ? "_Legacy" : "";
            } else {
                item.item_data.meshName = item.item_data.meshName.replace("_Legacy", "");
            }
        });
        if (extern.inGame) extern.updateLegacySkinsInGame(enabled);
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
    }
    
    getHUDElems() {
        return Object.entries(this.hudElemSelectors)
        .filter(([id, _]) => !this.hudHidden || extern.modSettingEnabled(`hideHUD_${id}`))
        .flatMap(([_, selectors]) => selectors)
        .flatMap(selector => Array.from(document.querySelectorAll(selector))).filter(Boolean);
    }

    toggleHideHUD(disable) {
        this.hudHidden = disable ? false : !this.hudHidden;
        this.updateHUDVisibility();
    }

    disableHideHUD() {
        this.toggleHideHUD(true);
    }

    updateHUDVisibility() {
        this.getHUDElems().forEach(e => e.style.opacity = this.hudHidden ? 0 : 1);
        if (!this.hudHidden || extern.modSettingEnabled("hideHUD_nametags")) extern.hideNametags(this.hudHidden);
        if (!this.hudHidden || extern.modSettingEnabled("hideHUD_outlines")) extern.hideOutlines(this.hudHidden);
        if (extern.inGame && (!this.hudHidden || extern.modSettingEnabled("hideHUD_pickups"))) extern.hidePickups(this.hudHidden);
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
        if (!(extern.modSettingEnabled("killstreakInfo") && timer && document.getElementById("healthHp"))) return;
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
            extern.tryUpdateGrenades();
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
        extern.getSpecSpeed = () => extern.modSettingEnabled("specTweaks") ? (unsafeWindow.megaMod.getModSettingById("specTweaks_speedSlider").value / 100) : 1;
    }

    toggleFreezeFrame() {
        extern.freezeFrame(this.freezeFrame = !this.freezeFrame);
        if (this.freezeFrame) {
            if (this.freezeInterval) clearInterval(this.freezeInterval);
            this.freezeInterval = setInterval(() => {
                if (vueApp.ui.game.spectate) return;
                clearInterval(this.freezeInterval);
                extern.freezeFrame(this.freezeFrame = false);
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

        this.themes = themes;
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
                Object.assign(style, { rel: 'stylesheet', href: (cdnPath + theme.url), disabled: disabled });
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
            if (!document.getElementById('themeDesc')) return;
            clearInterval(themeDescInterval);
            document.getElementById('themeDesc').innerHTML = vueApp.loc[this.themes.find(t => t.id === unsafeWindow.megaMod.getModSettingById('themeManager_themeSelect').value).locKey];
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

    setSkybox(skybox) {
        this.skybox = skybox;
    }

    onSkyboxCategoryChanged(value, init) {
        const isCustomSkyboxEnabled = extern.modSettingEnabled("customSkybox");
        this.usingSkyboxColor = value === "colors";
        let hex;
        if (this.usingSkyboxColor) {
            hex = unsafeWindow.megaMod.getModSettingById('customSkybox_colorPicker').value;
        } else {
            const select = unsafeWindow.megaMod.getModSettingById('customSkybox_skyboxSelect');
            select.options = this.skyboxes[value];
            if (!init) unsafeWindow.megaMod.updateModSetting("customSkybox_skyboxSelect", select.options[0].id);
        }
        // Source Modification is goofy - reload if function doesn't exist
        //if (!extern?.updateSkybox) window.location.reload();
        extern.updateSkybox(isCustomSkyboxEnabled, hex);
    }
}

class CustomFog {
    constructor() { 
        this.fog = { density: 0, color: "#FFF"}; 
        this.inGame = false;

        extern.resetFog = () => {
            if (!extern.inGame) return;
            BAWK.play("ui_reset");
            unsafeWindow.megaMod.updateModSetting("customFog_densitySlider", this.fog.density * 100);
            unsafeWindow.megaMod.updateModSetting("customFog_colorPicker", this.fog.color);
            extern.updateFog(
                extern.modSettingEnabled("customFog"),
                this.fog.density,
                this.fog.color
            );
        };        
    }

    initFog(fog) {
        this.fog = fog;
        if (extern.modSettingEnabled("customFog")) extern.updateFog(
            true,
            unsafeWindow.megaMod.getModSettingById('customFog_densitySlider').value / 100, 
            unsafeWindow.megaMod.getModSettingById('customFog_colorPicker').value,
        );
    }
}

MegaMod.setDebug(true);
Object.assign(unsafeWindow, {
	SettingType: {
		Slider: 0,
		Toggler: 1,
		Keybind: 2,
		Select: 3,
		Group: 4,
		HTML: 5,
        Button: 6,
        ColorPicker: 7
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
	},
	teamLocs: ['team_blue', 'team_red'],
    BadgeMsgType: {
        coreGained: 0,
        coreLost: 1,
        tierUpgrade: 2,
        tierDowngrade: 3,
        tierLost: 4
    },
	rawPath: "https://raw.githubusercontent.com/1nf1n1t3Sm4sh3r/mmTest/main", // https://raw.githubusercontent.com/1nf1n1t3Sm4sh3r/mmTest/main
	cdnPath: "https://1nf1n1t3sm4sh3r.github.io/mmTest", // https://1nf1n1t3sm4sh3r.github.io/mmTest
});
Object.assign(unsafeWindow, {
    ChatEventData: {
        [ChatEvent.joinGame]: {
            locKey: 'megaMod_betterUI_chatEvent_joinGame',
            setting: 'betterUI_chatEvent_joinGame'
        },
        [ChatEvent.leaveGame]: {
            locKey: 'megaMod_betterUI_chatEvent_leaveGame',
            setting: 'betterUI_chatEvent_leaveGame'
        },
        [ChatEvent.switchTeam]: {
            locKey: 'megaMod_betterUI_chatEvent_switchTeam',
            setting: 'betterUI_chatEvent_switchTeam'
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

const oldAppend = HTMLElement.prototype.appendChild;
HTMLElement.prototype.appendChild = function(child) {
    if (this.tagName === "BODY" && child?.tagName === "SCRIPT" && child.textContent?.includes("babylonjs")) {
        child.textContent = MegaMod.editSource(child.textContent);
        HTMLElement.prototype.appendChild = oldAppend;
    }
    return oldAppend.call(this, child);
};

MegaMod.log("Script Loaded:", `Page Status - ${document.readyState}`);