package com.trufun.webrcp.swt.demos.client.demos;

import org.eclipse.swt.SWT;
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.swt.widgets.Tree;
import org.eclipse.swt.widgets.TreeColumn;
import org.eclipse.swt.widgets.TreeItem;

public class Tree2 {
	public static void main(String[] args) {
		final Display display = Display.getDefault();
		final Shell shell = new Shell();
		shell.setSize(327, 253);
		// ---------创建窗口中的其他界面组件-------------
		shell.setLayout(new FillLayout());

		// 创建一个Tree,并显示表头和表格线
		final Tree tree = new Tree(shell, SWT.BORDER);
		tree.setHeaderVisible(true);
		tree.setLinesVisible(true);

		// 加入三列
		TreeColumn col1 = new TreeColumn(tree, SWT.NONE);
		col1.setText("姓名");
		col1.setWidth(100);
		TreeColumn col2 = new TreeColumn(tree, SWT.NONE);
		col2.setText("职位");
		col2.setWidth(80);
		TreeColumn col3 = new TreeColumn(tree, SWT.NONE);
		col3.setText("特点");
		col3.setWidth(100);

		// 第一个记录树
		TreeItem item1 = new TreeItem(tree, SWT.NONE);
		item1.setText("PPP项小组");
		// createItem是生成子结点的自定义方法
		createItem(item1, "黄俊", "组长", "技术全面");
		createItem(item1, "黄钰", "程序员", "编程超快");
		createItem(item1, "张浩", "程序员", "专攻难点");
		createItem(item1, "周阅", "测试员", "认真负责");

		// 第二个记录树
		TreeItem item2 = new TreeItem(tree, SWT.NONE);
		item2.setText("中国足球队");
		createItem(item2, "陈刚", "后勤", "擦鞋很专业");

		// 监听树的选择事件，并将所选记录的文字显示在窗口标题栏
		tree.addSelectionListener(new SelectionAdapter() {
			public void widgetSelected(SelectionEvent e) {
				TreeItem[] items = tree.getSelection();
				TreeItem o = items[0];
				shell.setText(o.getText(0) + "," + o.getText(1) + ","
						+ o.getText(2));
			}
		});
		// -----------------END------------------------
		shell.layout();
		shell.open();
		// while (!shell.isDisposed()) {
		// if (!display.readAndDispatch())
		// display.sleep();
		// }
		// display.dispose();
	}

	/**
	 * 自定义方法。生成TableTreeItem
	 */
	private static TreeItem createItem(TreeItem parentItem, String name,
			String job, String desc) {
		TreeItem childItem = new TreeItem(parentItem, SWT.NONE);
		childItem.setText(name);
		childItem.setText(1, job);
		childItem.setText(2, desc);
		return childItem;
	}
}
