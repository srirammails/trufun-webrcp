package org.eclipse.gef.client.standalone.example.model;

import java.beans.PropertyChangeListener;
import java.beans.PropertyChangeSupport;

import org.eclipse.draw2d.geometry.Rectangle;

public class ChildModel {
	public static final String P_CONSTRAINT = "_constraint";
	private PropertyChangeSupport listeners = new PropertyChangeSupport(this);
	private Rectangle constraint;

	public ChildModel() {
		setConstraint(new Rectangle(0, 0, -1, -1));
	}

	public ChildModel(Rectangle r) {
		setConstraint(r);
	}

	public void addPropertyChangeListener(PropertyChangeListener l) {
		listeners.addPropertyChangeListener(l);
	}

	public void firePropertyChange(String propName, Object oldValue,
			Object newValue) {
		listeners.firePropertyChange(propName, oldValue, newValue);
	}

	public Rectangle getConstraint() {
		return constraint;
	}

	public void removePropertyChangeListener(PropertyChangeListener l) {
		listeners.removePropertyChangeListener(l);
	}

	public void setConstraint(Rectangle r) {
		constraint = r;
		firePropertyChange(P_CONSTRAINT, null, r);
	}

}
