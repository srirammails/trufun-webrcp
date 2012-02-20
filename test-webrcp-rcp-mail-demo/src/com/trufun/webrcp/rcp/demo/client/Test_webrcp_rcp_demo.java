package com.trufun.webrcp.rcp.demo.client;

import java.util.List;
import java.util.Map;

import org.eclipse.jface.action.ICoolBarManager;
import org.eclipse.jface.action.IMenuManager;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.ui.PlatformUI;
import org.java.lang2.INewInstance;

import com.trufun.ui.app.RCPApp;
import com.trufun.ui.impl.rcp.PluginResource;
import com.trufun.webrcp.rcp.demo.shared.FieldVerifier;
import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.GWT;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.event.dom.client.KeyCodes;
import com.google.gwt.event.dom.client.KeyUpEvent;
import com.google.gwt.event.dom.client.KeyUpHandler;
import com.google.gwt.resources.client.TextResource;
import com.google.gwt.user.client.rpc.AsyncCallback;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.DialogBox;
import com.google.gwt.user.client.ui.HTML;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.user.client.ui.TextBox;
import com.google.gwt.user.client.ui.VerticalPanel;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class Test_webrcp_rcp_demo extends RCPApp{

	ApplicationActionBarAdvisor app = new ApplicationActionBarAdvisor();
	@Override
	protected String getApplicationName() {
		// TODO Auto-generated method stub
		return "RCP Mail template created by PDE";
	}

	@Override
	protected String getInitialWindowPerspectiveId() {
		// TODO Auto-generated method stub
		return "test-rcp.perspective";
	}

	@Override
	protected boolean isShowMenuBar() {
		// TODO Auto-generated method stub
		return true;
	}

	@Override
	protected void register_Class2_forName(Map<String, Class> map) {
		map.put("com.trufun.webrcp.rcp.demo.client.Perspective", Perspective.class);
		map.put("com.trufun.webrcp.rcp.demo.client.View", View.class);
		map.put("com.trufun.webrcp.rcp.demo.client.NavigationView", NavigationView.class);
		
	}

	@Override
	protected void register_Class2_newInstance(Map<String, INewInstance> map) {
		map.put("com.trufun.webrcp.rcp.demo.client.Perspective", new INewInstance(){

			@Override
			public Object newInstance() {
				// TODO Auto-generated method stub
				return new Perspective();
			}

			@Override
			public Object newInstance(Object args) {
				// TODO Auto-generated method stub
				return null;
			}});
		map.put("com.trufun.webrcp.rcp.demo.client.View", new INewInstance(){

			@Override
			public Object newInstance() {
				// TODO Auto-generated method stub
				return new View();
			}

			@Override
			public Object newInstance(Object args) {
				// TODO Auto-generated method stub
				return null;
			}});
		map.put("com.trufun.webrcp.rcp.demo.client.NavigationView", new INewInstance(){

			@Override
			public Object newInstance() {
				// TODO Auto-generated method stub
				return new NavigationView();
			}

			@Override
			public Object newInstance(Object args) {
				// TODO Auto-generated method stub
				return null;
			}});
		
	}

	@Override
	protected boolean isShowCoolBar() {
		// TODO Auto-generated method stub
		return true;
	}

	@Override
	protected void registerPluginResources(List<PluginResource> resources) {
		// TODO Auto-generated method stub
		resources.add(this.createPluginResource("NavigationView", Resources.INSTANCE.plugin_xml(), null));
	}

	@Override
	protected TextResource getDefaultPerferenceStoreResource() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	protected void fillMenuBar(IMenuManager menuBar) {
		// TODO Auto-generated method stub
		app.makeActions(PlatformUI.getWorkbench().getActiveWorkbenchWindow());
		app.fillMenuBar(menuBar);
		
	}

	@Override
	protected void fillCoolBar(ICoolBarManager coolBar) {
		// TODO Auto-generated method stub
		app.fillCoolBar(coolBar);
		
	}

	@Override
	protected void preWindowOpen(Shell shell) {
		// TODO Auto-generated method stub
		
	}

	@Override
	protected void postWindowOpen(Shell shell) {
		// TODO Auto-generated method stub
		
	}
//implements EntryPoint {
//	/**
//	 * The message displayed to the user when the server cannot be reached or
//	 * returns an error.
//	 */
//	private static final String SERVER_ERROR = "An error occurred while "
//			+ "attempting to contact the server. Please check your network "
//			+ "connection and try again.";
//
//	/**
//	 * Create a remote service proxy to talk to the server-side Greeting service.
//	 */
//	private final GreetingServiceAsync greetingService = GWT
//			.create(GreetingService.class);
//
//	/**
//	 * This is the entry point method.
//	 */
//	public void onModuleLoad() {
//		final Button sendButton = new Button("Send");
//		final TextBox nameField = new TextBox();
//		nameField.setText("GWT User");
//		final Label errorLabel = new Label();
//
//		// We can add style names to widgets
//		sendButton.addStyleName("sendButton");
//
//		// Add the nameField and sendButton to the RootPanel
//		// Use RootPanel.get() to get the entire body element
//		RootPanel.get("nameFieldContainer").add(nameField);
//		RootPanel.get("sendButtonContainer").add(sendButton);
//		RootPanel.get("errorLabelContainer").add(errorLabel);
//
//		// Focus the cursor on the name field when the app loads
//		nameField.setFocus(true);
//		nameField.selectAll();
//
//		// Create the popup dialog box
//		final DialogBox dialogBox = new DialogBox();
//		dialogBox.setText("Remote Procedure Call");
//		dialogBox.setAnimationEnabled(true);
//		final Button closeButton = new Button("Close");
//		// We can set the id of a widget by accessing its Element
//		closeButton.getElement().setId("closeButton");
//		final Label textToServerLabel = new Label();
//		final HTML serverResponseLabel = new HTML();
//		VerticalPanel dialogVPanel = new VerticalPanel();
//		dialogVPanel.addStyleName("dialogVPanel");
//		dialogVPanel.add(new HTML("<b>Sending name to the server:</b>"));
//		dialogVPanel.add(textToServerLabel);
//		dialogVPanel.add(new HTML("<br><b>Server replies:</b>"));
//		dialogVPanel.add(serverResponseLabel);
//		dialogVPanel.setHorizontalAlignment(VerticalPanel.ALIGN_RIGHT);
//		dialogVPanel.add(closeButton);
//		dialogBox.setWidget(dialogVPanel);
//
//		// Add a handler to close the DialogBox
//		closeButton.addClickHandler(new ClickHandler() {
//			public void onClick(ClickEvent event) {
//				dialogBox.hide();
//				sendButton.setEnabled(true);
//				sendButton.setFocus(true);
//			}
//		});
//
//		// Create a handler for the sendButton and nameField
//		class MyHandler implements ClickHandler, KeyUpHandler {
//			/**
//			 * Fired when the user clicks on the sendButton.
//			 */
//			public void onClick(ClickEvent event) {
//				sendNameToServer();
//			}
//
//			/**
//			 * Fired when the user types in the nameField.
//			 */
//			public void onKeyUp(KeyUpEvent event) {
//				if (event.getNativeKeyCode() == KeyCodes.KEY_ENTER) {
//					sendNameToServer();
//				}
//			}
//
//			/**
//			 * Send the name from the nameField to the server and wait for a response.
//			 */
//			private void sendNameToServer() {
//				// First, we validate the input.
//				errorLabel.setText("");
//				String textToServer = nameField.getText();
//				if (!FieldVerifier.isValidName(textToServer)) {
//					errorLabel.setText("Please enter at least four characters");
//					return;
//				}
//
//				// Then, we send the input to the server.
//				sendButton.setEnabled(false);
//				textToServerLabel.setText(textToServer);
//				serverResponseLabel.setText("");
//				greetingService.greetServer(textToServer,
//						new AsyncCallback<String>() {
//							public void onFailure(Throwable caught) {
//								// Show the RPC error message to the user
//								dialogBox
//										.setText("Remote Procedure Call - Failure");
//								serverResponseLabel
//										.addStyleName("serverResponseLabelError");
//								serverResponseLabel.setHTML(SERVER_ERROR);
//								dialogBox.center();
//								closeButton.setFocus(true);
//							}
//
//							public void onSuccess(String result) {
//								dialogBox.setText("Remote Procedure Call");
//								serverResponseLabel
//										.removeStyleName("serverResponseLabelError");
//								serverResponseLabel.setHTML(result);
//								dialogBox.center();
//								closeButton.setFocus(true);
//							}
//						});
//			}
//		}
//
//		// Add a handler to send the name to the server
//		MyHandler handler = new MyHandler();
//		sendButton.addClickHandler(handler);
//		nameField.addKeyUpHandler(handler);
//	}
}
