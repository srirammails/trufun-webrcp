package org.eclipse.gef.client.standalone.example;

import java.util.Collections;
import java.util.EventObject;
import java.util.List;

import org.eclipse.draw2d.geometry.Rectangle;
import org.eclipse.gef.EditDomain;
import org.eclipse.gef.EditPart;
import org.eclipse.gef.EditPolicy;
import org.eclipse.gef.GraphicalViewer;
import org.eclipse.gef.RequestConstants;
import org.eclipse.gef.client.standalone.example.editparts.ChildEditPart;
import org.eclipse.gef.client.standalone.example.editparts.MyEditPartFactory;
import org.eclipse.gef.client.standalone.example.model.ChildModel;
import org.eclipse.gef.client.standalone.example.model.ParentModel;
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

/**
 * @author takA
 * 
 *         ���̐������ꂽ�R�����g�̑}����e���v���[�g��ύX���邽�� �E�B���h�E > �ݒ� >
 *         Java > �R�[�h���� > �R�[�h�ƃR�����g
 */
public class MyWindow extends ApplicationWindow implements
		ISelectionChangedListener, CommandStackListener {
	private GraphicalViewer viewer;
	private List selections = Collections.EMPTY_LIST;
	private boolean isDirty = false;

	class LeftAction extends Action {
		public LeftAction() {
			setImageDescriptor(ImageDescriptor.createFromFile(MyWindow.class,
					"left.gif"));
			setToolTipText("Left");
		}

		public void run() {
			if (selections.isEmpty())
				return;

			EditPart part = (EditPart) selections.get(0);
			AlignmentRequest req = new AlignmentRequest(
					RequestConstants.REQ_ALIGN);
			req.setEditParts(selections);
			if (part instanceof ChildEditPart) {

				Command command = part.getEditPolicy(EditPolicy.COMPONENT_ROLE)
						.getCommand(req);
				if (command != null)
					viewer.getEditDomain().getCommandStack().execute(command);
			}
		}
	}

	class UndoAction extends Action {
		public UndoAction() {
			setToolTipText("Undo");
			setImageDescriptor(ImageDescriptor.createFromFile(MyWindow.class,
					"undo.gif"));

		}

		public void run() {
			CommandStack stack = viewer.getEditDomain().getCommandStack();
			if (stack.canUndo())
				stack.undo();
		}
	}

	class RedoAction extends Action {
		public RedoAction() {
			setToolTipText("Redo");
			setImageDescriptor(ImageDescriptor.createFromFile(MyWindow.class,
					"redo.gif"));

		}

		public void run() {
			CommandStack stack = viewer.getEditDomain().getCommandStack();
			if (stack.canRedo())
				stack.redo();
		}
	}

	public MyWindow() {
		super(null);
	}

	public static void main(String[] args) {
		MyWindow window = new MyWindow();

		window.addToolBar(SWT.FLAT);
		window.setBlockOnOpen(true);
		window.open();

		// Display.getCurrent().dispose();
	}

	protected Control createContents(Composite parent) {
		Composite composite = new Composite(parent, SWT.BORDER);
		composite.setLayout(new FillLayout());

		viewer = new ScrollingGraphicalViewer();
		viewer.setEditDomain(new EditDomain());

		viewer.createControl(composite);

		ParentModel model = new ParentModel();
		model.addChild(new ChildModel(new Rectangle(60, 5, 80, 20)));
		model.addChild(new ChildModel(new Rectangle(30, 30, 100, 50)));
		viewer.setEditPartFactory(new MyEditPartFactory());
		viewer.setContents(model);
		viewer.addSelectionChangedListener(this);
		viewer.getEditDomain().getCommandStack().addCommandStackListener(this);

		return composite;
	}

	protected ToolBarManager createToolBarManager(int style) {
		ToolBarManager manager = new ToolBarManager(style);

		manager.add(new LeftAction());
		manager.add(new Separator());
		manager.add(new UndoAction());

		manager.add(new RedoAction());
		return manager;
	}

	public void selectionChanged(SelectionChangedEvent event) {
		selections = ((StructuredSelection) event.getSelection()).toList();
	}

	public void commandStackChanged(EventObject event) {
		if (!isDirty)
			isDirty = true;
	}

	public boolean close() {
		if (isDirty) {
			if (!MessageDialog.openQuestion(getShell(), "�m�F", "�I�����܂���"))
				return false;
		}
		viewer.getEditDomain().getCommandStack()
				.removeCommandStackListener(this);
		viewer.removeSelectionChangedListener(this);
		return super.close();
	}

}
