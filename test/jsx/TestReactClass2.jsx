import React from 'react';

class TestReactClass extends React.Component {

	render() {
		return (
				<div className='test'>
					<div className='test-exist' key='jdj'></div>
					<div className='test-without space'></div>
					<div className='test-no-2'></div>
					<div className='test-no-3'></div>
				</div>
		);
	}

}

export default TestReactClass;
