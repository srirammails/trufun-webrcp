package com.trufun.webrcp.swt.demos.client.demos;

import org.eclipse.swt.*;
import org.eclipse.swt.events.*;
import org.eclipse.swt.graphics.*;
import org.eclipse.swt.layout.*;
import org.eclipse.swt.widgets.*;

public class Snippet112 {

	public static void main(String[] args) {
		Display display = new Display();
		final Image image = new Image(display, 20, 20);
		Color color = display.getSystemColor(SWT.COLOR_RED);
		GC gc = new GC(image);
		gc.setBackground(color);
		gc.fillRectangle(image.getBounds());
		gc.dispose();

		Shell shell = new Shell(display);
		shell.setLayout(new FillLayout());
		Group group = new Group(shell, SWT.NONE);
		group.setLayout(new FillLayout());
		group.setText("a square");
		// final Canvas canvas = new Canvas (group, SWT.NONE);
		// canvas.addPaintListener (new PaintListener () {
		// public void paintControl (PaintEvent e) {
		// //e.gc.drawImage (image, 0, 0);
		// e.gc.drawRectangle(canvas.getClientArea());
		// }
		// });

		Button btn = new Button(group, SWT.PUSH);
		btn.setText("hello");
		shell.pack();
		shell.open();
		// while (!shell.isDisposed ()) {
		// if (!display.readAndDispatch ())
		// display.sleep ();
		// }
		// image.dispose ();
		// display.dispose ();
	}
}