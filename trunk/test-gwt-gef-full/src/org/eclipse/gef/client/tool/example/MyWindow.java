package org.eclipse.gef.client.tool.example;

import org.eclipse.draw2d.geometry.Point;
import org.eclipse.draw2d.geometry.Rectangle;
import org.eclipse.gef.EditDomain;
import org.eclipse.gef.client.tool.example.actions.ConnectionCreationActoin;
import org.eclipse.gef.client.tool.example.actions.CreationToolAction;
import org.eclipse.gef.client.tool.example.actions.SelectionToolAction;
import org.eclipse.gef.client.tool.example.editparts.MyEditPartFactory;
import org.eclipse.gef.client.tool.example.model.CanvasModel;
import org.eclipse.gef.client.tool.example.model.OrangeModel;
import org.eclipse.gef.ui.parts.ScrollingGraphicalViewer;
import org.eclipse.jface.action.ToolBarManager;
import org.eclipse.jface.window.ApplicationWindow;
import org.eclipse.swt.SWT;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Control;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Shell;

public class MyWindow extends ApplicationWindow {
	private ScrollingGraphicalViewer viewer;
	private EditDomain editDomain;

	public MyWindow() {
		super(null);
		editDomain = new EditDomain();
	}

	public static void main(String[] args) {
		MyWindow window = new MyWindow();
		window.setBlockOnOpen(true);
		window.addToolBar(SWT.FLAT);
		window.open();

		// Display.getCurrent().dispose();
	}

	protected org.eclipse.swt.graphics.Point getInitialSize() {
		return new org.eclipse.swt.graphics.Point(400, 300);
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see
	 * org.eclipse.jface.window.Window#createContents(org.eclipse.swt.widgets
	 * .Composite)
	 */
	protected Control createContents(Composite parent) {
		Composite composite = new Composite(parent, SWT.BORDER);
		composite.setLayout(new FillLayout());

		// �O���t�B�J���E�r���[���̍쐬
		viewer = new ScrollingGraphicalViewer();
		viewer.setEditDomain(editDomain);
		viewer.createControl(composite);

		viewer.setEditPartFactory(new MyEditPartFactory());
		CanvasModel model = new CanvasModel();
		model.addChild(new OrangeModel());// (new Rectangle(30,30,40,30)));
		model.addChild(new OrangeModel());// (new Rectangle(0,0,200,200)));
		viewer.setContents(model);
		return composite;
	}

	/*
	 * (�� Javadoc)
	 * 
	 * @see org.eclipse.jface.window.ApplicationWindow#createToolBarManager(int)
	 */
	protected ToolBarManager createToolBarManager(int style) {
		ToolBarManager manager = new ToolBarManager(style);
		manager.add(new SelectionToolAction("Select", editDomain));
		manager.add(new CreationToolAction("New Node", editDomain));
		manager.add(new ConnectionCreationActoin("New Connection", editDomain));
		return manager;
	}

}