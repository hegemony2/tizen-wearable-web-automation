{{#devices}}
<li class="li-has-toggle">
	<label>{{this.Name}}
		<div class="ui-toggleswitch">
			<input type="checkbox" name="deviceList" id="{{this.MyQDeviceId}}" class="ui-switch-input" {{?this.isOn}}checked="checked"{{/this.isOn}} />
			<div class="ui-switch-button"></div>
		</div>
	</label>
</li>
{{/devices}}
