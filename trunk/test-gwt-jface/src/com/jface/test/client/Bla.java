package com.jface.test.client;

import org.eclipse.jface.action.Action;
import org.eclipse.jface.action.MenuManager;
import org.eclipse.jface.action.ToolBarManager;
import org.eclipse.jface.window.ApplicationWindow;
import org.eclipse.swt.SWT;
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.graphics.Point;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Control;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Shell;

public class Bla extends ApplicationWindow {

	// UI Elements
	Button button;

	public Bla(Shell shell) {
		super(shell);
	}

	protected ToolBarManager createToolBarManager(int style) {

		ToolBarManager main_menu = new ToolBarManager(null);
		main_menu.add(new Action("Test") {
		});
		main_menu.add(new Action("Test") {
		});
		return main_menu;
	}

	protected MenuManager createMenuManager() {

		// 定义一菜单项。参数为 null 表示最上层的菜单（管理器）。

		MenuManager main_menu = new MenuManager(null);

		MenuManager action_menu = new MenuManager("&File");

		main_menu.add(action_menu); // 成为 main_menu 的下级菜单

		action_menu.add(new Action("Test") {
		});

		return main_menu;

	}

	@Override
	protected Point getInitialSize() {
		return new Point(400, 400);
	}

	@Override
	protected Control createContents(Composite parent) {

		button = new Button(parent, SWT.PUSH);
		button.setText("Click me");

		button.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent arg0) {
				button.setText("Hello World");
			}
		});

		// parent.pack();

		return parent;
	}

	public static void main(String args[]) {
		Display display = new Display();
		Shell shell = new Shell(display);
		Bla bla = new Bla(shell);
		bla.addMenuBar();
		bla.addToolBar(SWT.FLAT);

		bla.setBlockOnOpen(true);
		// shell.pack();
		try {
			bla.open();
		} catch (Exception e) {
			e.printStackTrace();
		}
		// display.dispose();
	}
}
