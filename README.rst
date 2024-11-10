``akalisten``
=============

Simple Python tooling to visualize the results of the participation polls for gigs of AkaBlas for the members.
Uses

- the API of the `NextCloud Polls App <https://apps.nextcloud.com/apps/polls>`_ to get the results. The API is documented `here <https://github.com/nextcloud/polls/blob/346f37964c53bb6cc132edbb1f113642d2bb2c39/docs/API_v1.0.md>`_.
- `Jinja2 <https://jinja.palletsprojects.com/>`_ for templating the HTML output.
- `pydanctic <hhttps://docs.pydantic.dev/>`_ definition of the data structures.

Installation and Usage
----------------------

- Make sure that you have installed `Python 3.12 <https://www.python.org/downloads/release/python-3120/>`_ as well as `pip <https://pip.pypa.io/en/stable/installation/>`_.
- Clone the repository and change into the directory::

    git clone https://github.com/AkaBlas/akalisten.git
    cd akalisten

- Install the dependencies. It is recommended to use a virtual environment::

    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt

- Copy the file ``.env.example`` to ``.env`` and adjust the values to your needs::

    cp .env.example .env
    nano .env

- Run the script::

    python main.py

- Open the file ``index.html`` in your browser.
