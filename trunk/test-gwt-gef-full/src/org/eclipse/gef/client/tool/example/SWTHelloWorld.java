/*******************************************************************************
 * Copyright (c) 2000, 2008 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package org.eclipse.gef.client.tool.example;

import org.eclipse.swt.SWT;
import org.eclipse.swt.widgets.*;
import org.eclipse.swt.graphics.*;
import org.eclipse.swt.layout.FillLayout;

import java.util.Collections;
import java.util.EventObject;
import java.util.List;

import org.eclipse.draw2d.geometry.Point;
import org.eclipse.draw2d.geometry.Rectangle;
import org.eclipse.gef.EditDomain;
import org.eclipse.gef.EditPart;
import org.eclipse.gef.EditPolicy;
import org.eclipse.gef.GraphicalViewer;
import org.eclipse.gef.RequestConstants;
import org.eclipse.gef.client.tool.example.editparts.MyEditPartFactory;
import org.eclipse.gef.client.tool.example.model.CanvasModel;
import org.eclipse.gef.client.tool.example.model.OrangeModel;
import org.eclipse.gef.commands.Command;
import org.eclipse.gef.commands.CommandStack;
import org.eclipse.gef.commands.CommandStackListener;
import org.eclipse.gef.requests.AlignmentRequest;
import org.eclipse.gef.ui.parts.ScrollingGraphicalViewer;
import org.eclipse.jface.action.Action;
import org.eclipse.jface.action.Separator;
import org.eclipse.jface.action.ToolBarManager;
import org.eclipse.jface.dialogs.MessageDialog;
import org.eclipse.jface.resource.ImageDescriptor;
import org.eclipse.jface.viewers.ISelectionChangedListener;
import org.eclipse.jface.viewers.SelectionChangedEvent;
import org.eclipse.jface.viewers.StructuredSelection;
import org.eclipse.jface.window.ApplicationWindow;
import org.eclipse.swt.SWT;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Control;
import org.eclipse.swt.widgets.Display;

public class SWTHelloWorld {
	private ScrollingGraphicalViewer viewer;
	private EditDomain editDomain;
	private List selections = Collections.EMPTY_LIST;
	private boolean isDirty = false;

	public SWTHelloWorld() {
		final Display display = new Display(new DeviceData());
		Shell shell = new Shell(display);
		shell.setText("SWT Shell");
		shell.setLayout(new FillLayout());

		// Label label = new Label(shell, SWT.NONE);
		// label.setText("Hello World");
		createContents(shell);

		shell.open();

		shell.addListener(SWT.Dispose, new Listener() {
			public void handleEvent(Event event) {
				display.dispose();
			}
		});
	}

	protected Control createContents(Composite parent) {
		Composite composite = new Composite(parent, SWT.BORDER);
		composite.setLayout(new FillLayout());

		// �O���t�B�J���E�r���[���̍쐬
		viewer = new ScrollingGraphicalViewer();
		viewer.setEditDomain(editDomain);
		viewer.createControl(composite);

		viewer.setEditPartFactory(new MyEditPartFactory());
		CanvasModel model = new CanvasModel();
		model.addChild(new OrangeModel(new Point(30, 30)));
		model.addChild(new OrangeModel(new Point(0, 0)));
		viewer.setContents(model);
		return composite;
	}

	static boolean isWeb() {
		if ("flex".equals(SWT.getPlatform()))
			return true;
		if ("dojo".equals(SWT.getPlatform()))
			return true;
		return false;
	}

	public static void main(String[] args) {
		new SWTHelloWorld();
		if (isWeb())
			return;
		Display display = Display.getCurrent();
		while (!display.isDisposed()) {
			if (!display.readAndDispatch())
				display.sleep();
		}
	}
}
