package org.eclipse.gef.client;

import org.eclipse.gef.client.standalone.example.MyWindow;
import org.eclipse.swt.SWT;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Event;
import org.eclipse.swt.widgets.Listener;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.swt.widgets.adpater.WidgetAdpaterManager;
import org.eclipse.swt.widgets.adpater.qx.AdapterFactory;
import org.eclipse.swt.widgets.adpater.qx.app.SWTApp;
import org.java.lang2.Class2;
import org.java.lang2.INewInstance;
import org.ufacekit.qx.wrapper.application.QooxdooApp;
import org.ufacekit.qx.wrapper.application.QxAbstractGui;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.GWT;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class Test_gwt_gef_full extends SWTApp {// implements EntryPoint {

	public void run() {

		Class2.registerForNames(
				"org.eclipse.gef.client.tool.example.model.OrangeModel",
				org.eclipse.gef.client.tool.example.model.OrangeModel.class);
		Class2.registerINewInstance(
				"org.eclipse.gef.client.tool.example.model.OrangeModel",
				new INewInstance() {

					@Override
					public Object newInstance() {
						return new org.eclipse.gef.client.tool.example.model.OrangeModel();
					}

					@Override
					public Object newInstance(Object args) {
						// TODO Auto-generated method stub
						return null;
					}
				});
		Class2.registerForNames(
				"org.eclipse.gef.client.tool.example.model.MyConnectionModel",
				org.eclipse.gef.client.tool.example.model.MyConnectionModel.class);
		Class2.registerINewInstance(
				"org.eclipse.gef.client.tool.example.model.MyConnectionModel",
				new INewInstance() {

					@Override
					public Object newInstance() {
						return new org.eclipse.gef.client.tool.example.model.MyConnectionModel();
					}

					@Override
					public Object newInstance(Object args) {
						// TODO Auto-generated method stub
						return null;
					}
				});

		Class2.registerForNames("com.trufun.ui.impl.AdapterManager",
				com.trufun.ui.impl.AdapterManager.class);
		Class2.registerINewInstance("com.trufun.ui.impl.AdapterManager",
				new INewInstance() {

					@Override
					public Object newInstance() {
						return new com.trufun.ui.impl.AdapterManager();
					}

					@Override
					public Object newInstance(Object args) {
						return null;
					}
				});
		Class2.registerForNames("com.trufun.ui.impl.ExtensionRegistry",
				com.trufun.ui.impl.ExtensionRegistry.class);
		Class2.registerINewInstance("com.trufun.ui.impl.ExtensionRegistry",
				new INewInstance() {

					@Override
					public Object newInstance() {
						return new com.trufun.ui.impl.ExtensionRegistry();
					}

					@Override
					public Object newInstance(Object args) {
						return null;
					}
				});
		Display display = new Display();
		final Shell shell = new Shell(display);

		shell.setLayout(new GridLayout(6, true));
		// {
		// Button button = new Button(shell, SWT.PUSH);
		// button.setText("Example");
		// button.addListener(SWT.Selection, new Listener() {
		// public void handleEvent(Event e) {
		//
		// MyWindow.main(null);
		// }
		// });
		// }

		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Example2");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					org.eclipse.gef.client.tool.example.MyWindow.main(null);
				}
			});
		}

		shell.pack();
		shell.open();
	}
}
