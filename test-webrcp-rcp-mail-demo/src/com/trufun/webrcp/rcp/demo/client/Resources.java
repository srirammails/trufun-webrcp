package com.trufun.webrcp.rcp.demo.client;

import com.google.gwt.core.client.GWT;
import com.google.gwt.resources.client.ClientBundle;
import com.google.gwt.resources.client.ImageResource;
import com.google.gwt.resources.client.TextResource;

public interface Resources extends ClientBundle {

	public static final Resources INSTANCE = GWT.create(Resources.class);



	@Source("plugin.xml")
	public TextResource plugin_xml();

}
